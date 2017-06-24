"use strict";

const OPTION_DEFAULTS = {
    linkedImagesRegexp: "\\.(jpg|jpeg|png|gifv)$",
    minWidth: 200,
    minHeight: 300,
};

let currentTab = undefined;
browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => { currentTab = tabs[0].id; });
browser.tabs.onActivated.addListener((activeInfo) => { currentTab = activeInfo.tabId; });
browser.windows.onFocusChanged.addListener((windowId) => {
    browser.tabs.query({ active: true, windowId: windowId }).then((tabs) => { currentTab = tabs[0].id; });
});

let state = {};

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
                prepareAndGoForward(extractLinks, { regexp: result.linkedImagesRegexp });
            });
    }

    if (command == "cycle-through-embedded-images") {
        browser.storage.local.get(["minWidth", "minHeight"])
            .then((result) => {
                prepareAndGoForward(extractImages, { minWidth: result.minWidth, minHeight: result.minHeight });
            });
    }

    if (command == "abort-cycling") {
        goToOrigin();
    }
});

function extractLinks(argumentObject) {
    let regexp = new RegExp(argumentObject.regexp, "i");

    let  matchingURLs = [];
    for (let link of document.links) {
        let isMatch = link.href.match(regexp);
        let isKnown =  matchingURLs.indexOf(link.href) >= 0;
        if (isMatch && !isKnown) {
            matchingURLs.push(link.href);
        }
    }

    let referers = [];
    for (let _url of matchingURLs) {
        referers.push([document.URL]);
    }

    return [matchingURLs, referers];
}

function extractImages(argumentObject) {
    let  matchingURLs = [];
    for (let image of document.images) {
        let imageURL = image.src;
        let isHighEnough = image.naturalHeight >= argumentObject.minHeight;
        let isWideEnough = image.naturalWidth >= argumentObject.minWidth;
        let isKnown = matchingURLs.indexOf(imageURL) >= 0;
        if (!isKnown && isHighEnough && isWideEnough) {
            matchingURLs.push(imageURL);
        }
    }

    let referers = [];
    for (let _url of matchingURLs) {
        referers.push([document.URL]);
    }

    return [matchingURLs, referers];
}

function prepareAndGoForward(extractorFunction, extractorFunctionArguments) {
    if (!state[currentTab]) {
        let getURLsAndReferers = browser.tabs.executeScript(
            currentTab,
            {
                allFrames: true,
                code: `
                    ${ extractorFunction.toString() };
                    ${ extractorFunction.name }(${ JSON.stringify(extractorFunctionArguments) })
                `,
            }
        );
        let getOrigin = browser.tabs.executeScript(currentTab, { code: "document.URL" });

        Promise.all([getURLsAndReferers, getOrigin])
            .then((result) => {
                let urlsAndReferersResults = result[0];
                let originResult = result[1];
                let origin = originResult[0];
                let urlsAndReferers = mergeFrameResults(urlsAndReferersResults);
                let urls = urlsAndReferers[0];
                let referers = urlsAndReferers[1];
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
    for (let array of results) {
        urls = [...urls, ...array[0]];
        referers = [...urls, ...array[1]];
    }

    return [urls, referers];
}

function getInitialTabData(urls, referers, origin) {
    if (!urls.length > 0) {
        return null;
    }

    let data = {
        index: -1,
        origin: origin,
        referers: referers,
        urls: urls,
    };
    return data;
}

function goForward() {
    let tabData = state[currentTab];

    if (!tabData) {
        return;
    }

    let urls = tabData.urls;
    let referers = tabData.referers;

    let newIndex = tabData.index + 1;
    if (newIndex >= urls.length) {
        goToOrigin();
        return;
    }

    let url = urls[newIndex];
    let referer = referers[newIndex];

    function addReferer(details) {
        browser.webRequest.onBeforeSendHeaders.removeListener(addReferer);

        let requestHeaders = details.requestHeaders;
        requestHeaders.push({name: "Referer", value: referer});

        return {requestHeaders: requestHeaders};
    }

    function handleRedirects(details) {
        urls[urls.indexOf(details.url)] = details.redirectUrl;
    }

    browser.webRequest.onBeforeSendHeaders.addListener(addReferer, {urls: [url]}, ["blocking", "requestHeaders"]);
    browser.webRequest.onBeforeRedirect.addListener(handleRedirects, {urls: [url]});
    browser.tabs.update(currentTab, { url: url });
}

browser.webNavigation.onCommitted.addListener(
    (details) => {
        let tabData = state[currentTab];

        if (!tabData) {
            return;
        }

        if (details.tabId != currentTab || details.frameId != 0) {
            return;
        }

        let index = tabData.urls.indexOf(details.url);
        if (index != -1) {
            tabData.index = index;
        } else {
            state[currentTab] = null;
        }
    }
);

function goToOrigin() {
    let tabData = state[currentTab];

    if (!tabData) {
        return;
    }

    browser.tabs.update(currentTab, { url: tabData.origin });
}
