"use strict";

const OPTION_DEFAULTS = {
    linkedImagesRegexp: "\\.(jpg|jpeg|png|gifv)$",
    minWidth: 200,
    minHeight: 300,
};

let currentTab = undefined;
browser.tabs.query({active: true, currentWindow: true}).then((tabs) => { currentTab = tabs[0].id; });
browser.tabs.onActivated.addListener((activeInfo) => { currentTab = activeInfo.tabId; });
browser.windows.onFocusChanged.addListener((windowId) => {
    browser.tabs.query({active: true, windowId: windowId}).then((tabs) => { currentTab = tabs[0].id; });
});

const state = {};

browser.storage.local.get(null)
    .then((result) => {
        if (Object.keys(result).length == 0) {
            browser.storage.local.set(OPTION_DEFAULTS);
        }
    });

browser.commands.onCommand.addListener(function(command) {
    if (command == "cycle-through-linked-images") {
        browser.storage.local.get(["linkedImagesRegexp"])
            .then((result) => {
                prepareAndGoForward(extractLinks, {regexp: result.linkedImagesRegexp});
            });
    }

    if (command == "cycle-through-embedded-images") {
        browser.storage.local.get(["minWidth", "minHeight"])
            .then((result) => {
                prepareAndGoForward(extractImages, {minWidth: result.minWidth, minHeight: result.minHeight});
            });
    }

    if (command == "abort-cycling") {
        goToOrigin();
    }
});

function extractLinks(argumentObject) {
    const regexp = new RegExp(argumentObject.regexp, "i");

    const  matchingURLs = [];
    for (const link of document.links) {
        const isMatch = link.href.match(regexp);
        const isKnown =  matchingURLs.indexOf(link.href) >= 0;
        if (isMatch && !isKnown) {
            matchingURLs.push(link.href);
        }
    }

    const referers = [];
    for (const _url of matchingURLs) {
        referers.push([document.URL]);
    }

    return [matchingURLs, referers];
}

function extractImages(argumentObject) {
    const  matchingURLs = [];
    for (const image of document.images) {
        const imageURL = image.src;
        const isHighEnough = image.naturalHeight >= argumentObject.minHeight;
        const isWideEnough = image.naturalWidth >= argumentObject.minWidth;
        const isKnown = matchingURLs.indexOf(imageURL) >= 0;
        if (!isKnown && isHighEnough && isWideEnough) {
            matchingURLs.push(imageURL);
        }
    }

    const referers = [];
    for (const _url of matchingURLs) {
        referers.push([document.URL]);
    }

    return [matchingURLs, referers];
}

function prepareAndGoForward(extractorFunction, extractorFunctionArguments) {
    if (!state[currentTab]) {
        const getURLsAndReferers = browser.tabs.executeScript(
            currentTab,
            {
                allFrames: true,
                code: `
                    ${ extractorFunction.toString() };
                    ${ extractorFunction.name }(${ JSON.stringify(extractorFunctionArguments) })
                `,
            }
        );
        const getOrigin = browser.tabs.executeScript(currentTab, {code: "document.URL"});

        Promise.all([getURLsAndReferers, getOrigin])
            .then((result) => {
                const urlsAndReferersResults = result[0];
                const originResult = result[1];
                const origin = originResult[0];
                const urlsAndReferers = mergeFrameResults(urlsAndReferersResults);
                const urls = urlsAndReferers[0];
                const referers = urlsAndReferers[1];
                state[currentTab] = getInitialTabData(urls, referers, origin);
                goForward();
            });
    } else {
        goForward();
    }
}

function mergeFrameResults(results) {
    let urls = [];
    let referers = [];
    for (const array of results) {
        urls = [...urls, ...array[0]];
        referers = [...urls, ...array[1]];
    }

    return [urls, referers];
}

function getInitialTabData(urls, referers, origin) {
    if (!urls.length > 0) {
        return null;
    }

    const data = {
        index: -1,
        origin: origin,
        referers: referers,
        urls: urls,
    };
    return data;
}

function goForward() {
    const tabData = state[currentTab];

    if (!tabData) {
        return;
    }

    const urls = tabData.urls;
    const referers = tabData.referers;

    const newIndex = tabData.index + 1;
    if (newIndex >= urls.length) {
        goToOrigin();
        return;
    }

    const url = urls[newIndex];
    const referer = referers[newIndex];

    function addReferer(details) {
        browser.webRequest.onBeforeSendHeaders.removeListener(addReferer);

        const requestHeaders = details.requestHeaders;
        requestHeaders.push({name: "Referer", value: referer});

        return {requestHeaders: requestHeaders};
    }

    function handleRedirects(details) {
        urls[urls.indexOf(details.url)] = details.redirectUrl;
    }

    browser.webRequest.onBeforeSendHeaders.addListener(addReferer, {urls: [url]}, ["blocking", "requestHeaders"]);
    browser.webRequest.onBeforeRedirect.addListener(handleRedirects, {urls: [url]});
    browser.tabs.update(currentTab, {url: url});
}

browser.webNavigation.onCommitted.addListener(
    (details) => {
        const tabData = state[currentTab];

        if (!tabData) {
            return;
        }

        if (details.tabId != currentTab || details.frameId != 0) {
            return;
        }

        const index = tabData.urls.indexOf(details.url);
        if (index != -1) {
            tabData.index = index;
        } else {
            state[currentTab] = null;
        }
    }
);

function goToOrigin() {
    const tabData = state[currentTab];

    if (!tabData) {
        return;
    }

    browser.tabs.update(currentTab, {url: tabData.origin});
}
