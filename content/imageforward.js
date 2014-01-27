var gImageForward = {

    preferences: Components
                     .classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefService),

    minHeight: function() {
        return gImageForward.preferences
                   .getIntPref("extensions.imageforward.minHeight")
    },

    minWidth: function() {
        return gImageForward.preferences
                   .getIntPref("extensions.imageforward.minWidth")
    },

    linkURLRegExp: function() {
        return gImageForward.preferences
                   .getCharPref("extensions.imageforward.linkURLRegExp")
    },

    imageURLRegExp: function() {
        return gImageForward.preferences
                   .getCharPref("extensions.imageforward.imageURLRegExp")
    },

    onLoad: function() {
        if ('undefined' == typeof gBrowser) {
            return;
        }
        window.removeEventListener('load', gImageForward.onLoad, false);
        window.addEventListener('unload', gImageForward.onUnload, false);
    },

    onUnload: function() {
        window.removeEventListener('unload', gImageForward.onUnload, false);
    },

    iterateImages: function() {
        gImageForward.go(
            function(document){return document.images},
            gImageForward.filterImages
        );
    },

    iterateImageLinks: function() {
        gImageForward.go(
            function(document){return document.links},
            gImageForward.matchLinkURLs
        );
    },

    abortIteration: function() {
        gImageForward.backToStart(gBrowser.selectedBrowser);
    },

    go: function(extractorFunction, filterFunction) {
        var browser = gBrowser.selectedBrowser;
        if (!browser) {
            return;
        }
        if (!browser.imageForwardLinks) {
            var documents = gImageForward.getDocuments(browser);
            var urlsAndReferrers = gImageForward.urlsAndReferrers(
                documents,
                extractorFunction,
                filterFunction
            );
            if (urlsAndReferrers.length == 0) {
                return;
            }
            gImageForward.initialize(browser, urlsAndReferrers);
        }
        // need to keep track of back/forward movements and new pages
        gImageForward.ensureHistoryListener(browser);
        gImageForward.ensureProgressListener(browser);
        // user went in back in history, just go forward in history
        if (browser.imageForwardHistoryAdjust < 0) {
            browser.contentWindow.history.forward();
            return;
        }
        var lastIndex = browser.imageForwardLinks.length - 1;
        if (browser.imageForwardNextIndex > lastIndex) {
            gImageForward.backToStart(browser)
            return;
        }
        gImageForward.loadNextImage(browser);
    },

    initialize: function(browser, urlsAndReferrers) {
        browser.imageForwardLinks = urlsAndReferrers;
        browser.imageForwardNextIndex = 0;
        // track uses os back/forward function of browser
        browser.imageForwardHistoryAdjust = 0;
        // manually keep track of what is added to history as urls can skip
        // history when iterating to fast. `browser.imageForwardLinks.length`
        // would point to before the initial page then
        browser.imageForwardHistoryIndex = 0;
    },

    reset: function(browser) {
        browser.imageForwardLinks = undefined;
        browser.imageForwardNextIndex = -1;
        browser.imageForwardHistoryAdjust = 0;
        browser.imageForwardHistoryIndex = 0;
    },

    backToStart: function(browser) {
        var backToStartAdjustment = 
            -(browser.imageForwardHistoryIndex
              + browser.imageForwardHistoryAdjust);
        gImageForward.reset(browser);
        browser.contentWindow.history.go(backToStartAdjustment);
    },

    getDocuments: function(browser) {
        var documents = new Array();
        documents.push(browser.contentWindow.document);
        var frames = browser.contentWindow.frames;
        for(var index = 0; index < frames.length; index++) {
            documents.push(frames[index].document);
        }
        return documents;
    },

    loadNextImage: function(browser) {
        var urlAndReferrer =
            browser.imageForwardLinks[browser.imageForwardNextIndex];
        var url = urlAndReferrer[0];
        // can't use loadURI for local urls - that's ok, no need for referrer
        if (url.indexOf("file://") == 0) {
            browser.contentDocument.location.assign(url)
        } else {
            var referrerURL = urlAndReferrer[1];
            browser.loadURI(url, makeURI(referrerURL), null);
        }
        browser.imageForwardNextIndex += 1;
    },

    urlsAndReferrers: function(documents, extractorFunction, filterFunction) {
        var result = new Array()
        for(var docIndex = 0; docIndex < documents.length; docIndex++) {
            var extractedThings = extractorFunction(documents[docIndex]);
            var urls = filterFunction(extractedThings);
            var referrer = documents[docIndex].URL;
            for(var urlIndex = 0; urlIndex < urls.length; urlIndex++) {
                result.push(gImageForward.makeTuple(urls[urlIndex], referrer));
            }
        }
        return result;
    },

    makeTuple: function(first, second) {
        var tuple = new Array()
        tuple.push(first);
        tuple.push(second);
        return tuple;
    },

    filterImages: function(images) {
        var result = new Array();
        var regexp = new RegExp(gImageForward.imageURLRegExp(), "i");
        for(var index = 0; index < images.length; index++) {
            var image = images[index];
            var imageURL = image.src;
            var isMatch = imageURL.match(regexp);
            var isHighEnough = image.height >= gImageForward.minHeight();
            var isWideEnough = image.width >= gImageForward.minWidth();
            var isKnown = result.indexOf(imageURL) >= 0;
            if (isMatch && !isKnown && isHighEnough && isWideEnough) {
                result.push(imageURL);
            }
        }
        return result;
    },

    matchLinkURLs: function(urls) {
        var result = new Array();
        var regexp = new RegExp(gImageForward.linkURLRegExp(), "i");
        for(var index = 0; index < urls.length; index++) {
            var urlString = urls[index].toString();
            var isMatch = urlString.match(regexp);
            var isKnown = result.indexOf(urlString) >= 0;
            if (isMatch && !isKnown) {
                result.push(urlString);
            }
        }
        return result;
    },

    ensureProgressListener: function(browser) {
        if (browser.imageForwardProgressListener) {
            return
        }
        var listener = gImageForward.progressListener(browser);
        // need to keep a reference, seems to be garbage collected otherwise
        browser.imageForwardProgressListener = listener;
        browser.addProgressListener(
            listener,
            Components.interfaces.nsIWebProgress.NOTIFY_LOCATION
        );
    },

    ensureHistoryListener: function(browser) {
        if (browser.imageForwardHistoryListener) {
            return
        }
        var listener = gImageForward.historyListener(browser);
        // need to keep a reference, seems to be garbage collected otherwise
        browser.imageForwardHistoryListener = listener;
        browser.sessionHistory.addSHistoryListener(listener);
    },

    containsURL: function(urlsAndReferrers, url) {
        if (!urlsAndReferrers) {
            return false;
        }
        for(var index = 0; index < urlsAndReferrers.length; index++) {
            if (urlsAndReferrers[index][0] == url){
                return true;
            }
        }
        return false;
    },

    isBackToStart: function(browser) {
        var relativeIndex =
            browser.imageForwardHistoryIndex
            + browser.imageForwardHistoryAdjust;
        return relativeIndex <= 0;
    },

    historyListener: function(browser) {
        return {
            QueryInterface: XPCOMUtils.generateQI([
                Components.interfaces.nsISHistoryListener,
                Components.interfaces.nsISupports,
                Components.interfaces.nsISupportsWeakReference
            ]),

            OnHistoryGoBack: function (uri) {
                if (browser.imageForwardLinks){
                    browser.imageForwardHistoryAdjust -= 1;
                    if (gImageForward.isBackToStart(browser)) {
                        gImageForward.reset(browser)
                    }
                }
                return true;
            },

            OnHistoryGoForward: function (uri) {
                if (browser.imageForwardLinks){
                    browser.imageForwardHistoryAdjust += 1;
                }
                return true;
            },

            OnHistoryGotoIndex: function (index, uri) {
                if (browser.imageForwardLinks){
                    var historyIndex = browser.sessionHistory.index;
                    browser.imageForwardHistoryAdjust = index - historyIndex;
                    if (gImageForward.isBackToStart(browser)) {
                        gImageForward.reset(browser)
                    }
                }
                return true;
            },

            OnHistoryNewEntry: function (uri) {
                if (browser.imageForwardLinks){
                    browser.imageForwardHistoryIndex += 1;
                }
                return true;
            }
        }
    },

    progressListener: function(browser) {
        return {
            QueryInterface: XPCOMUtils.generateQI([
                "nsIWebProgressListener",
                "nsISupportsWeakReference"
            ]),

            onLocationChange: function(
                    aWebProgress, aRequest, aLocation, aFlags) {
                if (!browser.imageForwardLinks || !aRequest) {
                    return false;
                }
                // originalURI is not consistently available
                if (!aRequest.originalURI) {
                    aRequest.QueryInterface(
                        Components.interfaces.nsIHttpChannel);
                }
                // need to reset when a new URL is entered, but not if it's one
                // of our image URLs(or a redirect from it - hence originalURI)
                if (!gImageForward.containsURL(
                        browser.imageForwardLinks,
                        aRequest.originalURI.asciiSpec)
                    ) {
                    gImageForward.reset(browser);
                }
            }
        }
    }
};

window.addEventListener('load', gImageForward.onLoad, false);

