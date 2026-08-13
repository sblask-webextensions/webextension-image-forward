"use strict";

import {OPTION_DEFAULTS} from "./option-defaults.js";

const tabOperationQueues = new Map();
const requests = new Map();

function logError(message, ...args) {
    console.error("[Image Forward] " + message, ...args);
}

async function onCommand(command, tabId) {
    let tab;
    try {
        tab = await browser.tabs.get(tabId);
    } catch (_error) {
        logError("Command ignored because tab no longer exists");
        return;
    }
    if (tab.url === undefined) {
        logError("Command ignored because tab URL is unavailable");
        return;
    }

    let tabData = await getTabData(tabId);

    if (command == "abort-cycling") {
        if (!tabData) {
            return;
        }
        await returnToStartURL(tabId, tabData.startURL);
        return;
    }

    if (!tabData) {
        let images = [];
        if (command == "cycle-through-embedded-images") {
            images = await extractImageURLs(tab, extractImages);
        }
        if (command == "cycle-through-linked-images") {
            images = await extractImageURLs(tab, extractLinks);
        }
        if (images.length == 0) {
            return;
        }

        tabData = {
            images: images,
            startURL: tab.url,
        };
        await setTabData(tabId, tabData);
    }

    if (tabData.images.length == 0) {
        return;
    }

    await goForward(tabId, tabData, tab.url);
}

browser.commands.onCommand.addListener(async function(command, tab) {
    if (tab === undefined) {
        [tab] = await browser.tabs.query({active: true, lastFocusedWindow: true});
    }
    if (tab === undefined || tab.id == -1) {
        return;
    }
    await enqueueTabOperation(tab.id, () => onCommand(command, tab.id));
});

function extractLinks(options) {
    const regexp = new RegExp(options.linkedImagesRegexp, "i");

    const matchingImages = [];
    for (const link of document.links) {
        const isMatch = link.href.match(regexp);
        const isKnown = matchingImages.some((image) => image.url == link.href);
        if (isMatch && !isKnown) {
            matchingImages.push({url: link.href, referer: document.URL});
        }
    }

    return matchingImages;
}

function extractImages(options) {
    const matchingImages = [];
    for (const image of document.images) {
        const imageURL = image.src;
        const isHighEnough = image.naturalHeight >= options.minHeight;
        const isWideEnough = image.naturalWidth >= options.minWidth;
        const isKnown = matchingImages.some((image) => image.url == imageURL);
        if (!isKnown && isHighEnough && isWideEnough) {
            matchingImages.push({url: imageURL, referer: document.URL});
        }
    }

    return matchingImages;
}

async function extractImageURLs(tab, extractorFunction) {
    const options = await browser.storage.local.get(OPTION_DEFAULTS);
    const knownURLs = new Set();
    const images = [];
    let frameResults;
    try {
        frameResults = await browser.scripting.executeScript({
            args: [options],
            func: extractorFunction,
            target: {
                allFrames: true,
                tabId: tab.id,
            },
        });
    } catch (error) {
        logError(`Could not extract images from ${tab.url}, because of ${error}`);
        return images;
    }
    for (const frameResult of frameResults) {
        for (const image of frameResult.result) {
            if (knownURLs.has(image.url)) {
                continue;
            }
            knownURLs.add(image.url);
            images.push(image);
        }
    }
    return images;
}

function getTabDataKey(tabId) {
    return `tab-${tabId}`;
}

async function getTabData(tabId) {
    const key = getTabDataKey(tabId);
    const {[key]: tabData} = await browser.storage.session.get(key);
    return tabData;
}

async function setTabData(tabId, tabData) {
    const key = getTabDataKey(tabId);
    await browser.storage.session.set({[key]: tabData});
}

async function removeTabData(tabId) {
    const key = getTabDataKey(tabId);
    await browser.storage.session.remove(key);
}

function getIndexForURL(tabData, url) {
    return tabData.images.findIndex((image) => image.url == url);
}

function enqueueTabOperation(tabId, operation) {
    const previousOperation = tabOperationQueues.get(tabId) || Promise.resolve();
    const currentOperation = previousOperation
        .catch((error) => {
            logError("Queued tab operation failed", {
                error,
                operation,
                tabId,
            });
        })
        .then(operation);
    tabOperationQueues.set(tabId, currentOperation);

    return currentOperation;
}

async function setRefererRule(tabId, referer) {
    await browser.declarativeNetRequest.updateSessionRules({
        addRules: [
            {
                action: {
                    requestHeaders: [
                        {
                            header: "referer",
                            operation: "set",
                            value: referer,
                        },
                    ],
                    type: "modifyHeaders",
                },
                condition: {
                    resourceTypes: ["main_frame"],
                    tabIds: [tabId],
                },
                id: tabId,
                priority: 1,
            },
        ],
        removeRuleIds: [tabId],
    });
}

async function removeRefererRule(tabId) {
    await browser.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [tabId],
    });
}

async function returnToStartURL(tabId, startURL) {
    requests.delete(tabId);
    await Promise.all([
        removeRefererRule(tabId),
        removeTabData(tabId),
    ]);
    await browser.tabs.update(tabId, {url: startURL});
}

async function goForward(tabId, tabData, currentURL) {
    const currentIndex = getIndexForURL(tabData, currentURL);
    const newIndex = currentIndex + 1;
    if (newIndex >= tabData.images.length) {
        await returnToStartURL(tabId, tabData.startURL);
        return;
    }

    requests.delete(tabId);
    const image = tabData.images[newIndex];
    await setRefererRule(tabId, image.referer);
    try {
        await browser.tabs.update(tabId, {url: image.url});
    } catch (error) {
        logError(`Could not load ${image.url} because of ${error}`);
        tabData.images.splice(newIndex, 1);
        await Promise.all([
            removeRefererRule(tabId),
            setTabData(tabId, tabData),
        ]);
        await goForward(tabId, tabData, currentURL);
    }
}

// make sure to exit image forward mode if navigated away from known image URLs
async function handleNavigatingAway(details) {
    // redirect for an image URL
    if (requests.get(details.tabId) == details.requestId) {
        return;
    }

    // initial request for a known URL
    const tabData = await getTabData(details.tabId);
    if (tabData !== undefined && getIndexForURL(tabData, details.url) != -1) {
        requests.set(details.tabId, details.requestId);
        return;
    }

    // an unknown request, exit image forward mode
    requests.delete(details.tabId);
    await Promise.all([
        removeRefererRule(details.tabId),
        removeTabData(details.tabId),
    ]);
}

browser.webRequest.onBeforeRequest.addListener(
    (details) => enqueueTabOperation(details.tabId, () => handleNavigatingAway(details)),
    {
        types: ["main_frame"],
        urls: ["<all_urls>"],
    },
);

// make sure a redirect from a known image URL does not exit image forward mode
async function handleImageRedirect(details) {
    if (requests.get(details.tabId) != details.requestId) {
        return;
    }

    const tabData = await getTabData(details.tabId);
    if (tabData === undefined) {
        return;
    }

    const image = tabData.images.find((image) => image.url == details.url);
    if (image === undefined) {
        return;
    }

    image.url = details.redirectUrl;
    await setTabData(details.tabId, tabData);
}

browser.webRequest.onBeforeRedirect.addListener(
    (details) => enqueueTabOperation(details.tabId, () => handleImageRedirect(details)),
    {
        types: ["main_frame"],
        urls: ["<all_urls>"],
    },
);

async function endOfRequestCleanup(details) {
    if (requests.get(details.tabId) != details.requestId) {
        return;
    }

    requests.delete(details.tabId);
    await removeRefererRule(details.tabId);
}

browser.webRequest.onCompleted.addListener(
    (details) => enqueueTabOperation(details.tabId, () => endOfRequestCleanup(details)),
    {
        types: ["main_frame"],
        urls: ["<all_urls>"],
    },
);

browser.webRequest.onErrorOccurred.addListener(
    (details) => enqueueTabOperation(details.tabId, () => endOfRequestCleanup(details)),
    {
        types: ["main_frame"],
        urls: ["<all_urls>"],
    },
);

async function cleanupWhenGoingTooFarBackInHistory(details) {
    if (details.frameId != 0 || !details.transitionQualifiers.includes("forward_back")) {
        return;
    }

    const tabData = await getTabData(details.tabId);
    if (tabData === undefined) {
        return;
    }

    if (getIndexForURL(tabData, details.url) == -1) {
        requests.delete(details.tabId);
        await Promise.all([
            removeRefererRule(details.tabId),
            removeTabData(details.tabId),
        ]);
    }
}

browser.webNavigation.onCommitted.addListener(
    (details) => enqueueTabOperation(details.tabId, () => cleanupWhenGoingTooFarBackInHistory(details))
);

async function cleanupOnTabClosed(tabId) {
    requests.delete(tabId);
    await Promise.all([
        removeRefererRule(tabId),
        removeTabData(tabId),
    ]);
}
browser.tabs.onRemoved.addListener(
    (tabId) => enqueueTabOperation(tabId, () => cleanupOnTabClosed(tabId))
);
