var gImageForward = {

    minHeightPreferencesKey: "extensions.imageforward.minHeight",
    minWidthPreferencesKey: "extensions.imageforward.minWidth",
    linkURLRegexpPreferencesKey: "extensions.imageforward.linkURLRegExp",
    imageURLRegexpPreferencesKey: "extensions.imageforward.imageURLRegExp",

    preferences: Components
                     .classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefService),

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
        gImageForward.go(function(document){return document.images}, gImageForward.filterImages);
    },

    iterateImageLinks: function() {
        gImageForward.go(function(document){return document.links}, gImageForward.matchLinkURLs);
    },

    go: function(extractorFunction, filterFunction) {
        var browser = gBrowser.selectedBrowser;
        if (!browser) {
            return;
        }
        if (!browser.imageForwardLinks) {
            var documents = gImageForward.getDocuments();
            var urlsAndReferrers =
                gImageForward.getURLsAndReferrers(documents, extractorFunction, filterFunction);
            if (urlsAndReferrers.length == 0) {
                return;
            }
            gImageForward.initialize(browser, urlsAndReferrers);
        }
        // need to keep track of back/forward movements and new pages
        gImageForward.ensureHistoryListener(browser);
        // user went in back in history, just go forward in history
        if (browser.imageForwardHistoryAdjust < 0) {
            browser.contentWindow.history.forward();
            return;
        }
        // reached last image, go back in history to initial page
        if (browser.imageForwardNextIndex > browser.imageForwardLinks.length - 1) {
            // have to manually keep track of steps taken forward as urls can
            // skip history when iterating to fast
            // browser.imageForwardLinks.length would point to before the
            // initial page then
            var backToStartAdjustment = -browser.imageForwardHistoryIndex;
            gImageForward.reset(browser);
            browser.contentWindow.history.go(backToStartAdjustment);
            return;
        }
        // actually load the next image
        gImageForward.goForward(browser);
    },

    initialize: function(browser, urlsAndReferrers) {
        browser.imageForwardLinks = urlsAndReferrers;
        browser.imageForwardNextIndex = 0;
        browser.imageForwardHistoryAdjust = 0;
        browser.imageForwardHistoryIndex = 0;
    },

    reset: function(browser) {
        browser.imageForwardLinks = undefined;
        browser.imageForwardNextIndex = -1;
        browser.imageForwardHistoryAdjust = 0;
        browser.imageForwardHistoryIndex = 0;
    },

    getDocuments: function() {
        var documents = new Array();
        documents.push(gBrowser.selectedBrowser.contentWindow.document);
        for(var index = 0; index < gBrowser.selectedBrowser.contentWindow.frames.length; index++) {
            documents.push(gBrowser.selectedBrowser.contentWindow.frames[index].document);
        }
        return documents;
    },

    goForward: function(browser) {
        var urlAndReferrer = browser.imageForwardLinks[browser.imageForwardNextIndex];
        var url = urlAndReferrer[0];
        if (url.indexOf("file://") == 0) {
            // can't use loadURI for local links - that's ok, no need for referrer here
            browser.contentDocument.location.assign(url)
        } else {
            var referrerURL = urlAndReferrer[1];
            browser.loadURI(url, makeURI(referrerURL), null);
        }
        browser.imageForwardNextIndex += 1;
    },

    getURLsAndReferrers: function(documents, extractorFunction, filterFunction) {
        var result = new Array()
        for(var documentIndex = 0; documentIndex < documents.length; documentIndex++) {
            var extractedThings = extractorFunction(documents[documentIndex]);
            var urls = filterFunction(extractedThings);
            var referrer = documents[documentIndex].URL;
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
        var minHeight = gImageForward.preferences.getIntPref(gImageForward.minHeightPreferencesKey);
        var minWidth = gImageForward.preferences.getIntPref(gImageForward.minWidthPreferencesKey);
        var regexpString = gImageForward.preferences.getCharPref(gImageForward.imageURLRegexpPreferencesKey);
        var regexp = new RegExp(regexpString, "i");
        for(var index = 0; index < images.length; index++) {
            var image = images[index];
            var imageURL = image.src;
            var isMatch = imageURL.match(regexp);
            var isHighEnough = image.height >= minHeight;
            var isWideEnough = image.width >= minWidth;
            var isKnown = result.indexOf(imageURL) >= 0;
            if (isMatch && !isKnown && isHighEnough && isWideEnough) {
                result.push(imageURL);
            }
        }
        return result;
    },

    matchLinkURLs: function(urls) {
        var result = new Array();
        var regexpString = gImageForward.preferences.getCharPref(gImageForward.linkURLRegexpPreferencesKey);
        var regexp = new RegExp(regexpString, "i");
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

    ensureHistoryListener: function(browser) {
        if (browser.imageForwardListener) {
            return
        }
        // need to keep a reference, seems to be garbage collected otherwise
        browser.imageForwardListener = gImageForward.historyListener(browser);
        browser.sessionHistory.addSHistoryListener(browser.imageForwardListener);
    },

    containsURL: function(urlsAndReferrers, url) {
        for(var index = 0; index < urlsAndReferrers.length; index++) {
            if (urlsAndReferrers[index][0] == url){
                return true;
            }
        }
        return false;
    },

    historyListener: function(browser) {
        return {
            QueryInterface: XPCOMUtils.generateQI([
                Components.interfaces.nsISHistoryListener,
                Components.interfaces.nsISupports,
                Components.interfaces.nsISupportsWeakReference
            ]),

            OnHistoryGoBack: function (uri) {
                console.log("HistoryGoBack");
                // TODO reset when back on start
                if (browser.imageForwardLinks){
                    browser.imageForwardHistoryAdjust -= 1;
                }
                return true;
            },

            OnHistoryGoForward: function (uri) {
                console.log("HistoryGoForward");
                if (browser.imageForwardLinks){
                    browser.imageForwardHistoryAdjust += 1;
                }
                return true;
            },

            OnHistoryGotoIndex: function (index, uri) {
                console.log("HistoryGotoIndex " + index);
                // TODO reset when back on start
                if (browser.imageForwardLinks){
                    browser.imageForwardHistoryAdjust = index - browser.sessionHistory.index;
                }
                return true;
            },

            OnHistoryNewEntry: function (uri) {
                console.log("HistoryNewEntry");
                if (browser.imageForwardLinks){
                    if (gImageForward.containsURL(browser.imageForwardLinks, uri.asciiSpec)) {
                        browser.imageForwardHistoryIndex += 1;
                    } else {
                        gImageForward.reset(browser);
                    }
                }
                return true;
            }
        }
    }
};

window.addEventListener('load', gImageForward.onLoad, false);

