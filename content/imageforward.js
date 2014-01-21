var gImageForward = {

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

    go: function() {
        var browser = gBrowser.selectedBrowser;
        if (!browser) {
            return;
        }
        if (!browser.imageForwardListenerAdded) {
            gImageForward.addHistoryListener(browser)
        }
        if (!browser.imageForwardLinks) {
            gImageForward.initialize(browser);
        }
        if (browser.imageForwardNextIndex > browser.imageForwardLinks.length - 1) {
            gImageForward.goBackAndReset(browser);
        } else {
            gImageForward.goForward(browser);
        }
    },

    initialize: function(browser) {
        var documents = gImageForward.getDocuments();
        var urlsAndReferrers = gImageForward.getURLsAndReferrers(documents);
        if (urlsAndReferrers.length > 0) {
            browser.imageForwardLinks = urlsAndReferrers;
            browser.imageForwardNextIndex = 0;
        }
    },

    getDocuments: function() {
        var documents = new Array();
        documents.push(gBrowser.selectedBrowser.contentWindow.document);
        for(var index = 0; index < gBrowser.selectedBrowser.contentWindow.frames.length; index++) {
            documents.push(gBrowser.selectedBrowser.contentWindow.frames[index].document);
        }
        return documents;
    },

    goBackAndReset: function(browser) {
        browser.contentWindow.history.go(-browser.imageForwardLinks.length)
        browser.imageForwardLinks = undefined;
        browser.imageForwardNextIndex = -1;
    },

    goForward: function(browser) {
        var urlAndReferrer = browser.imageForwardLinks[browser.imageForwardNextIndex];
        var url = urlAndReferrer[0];
        if (url.indexOf("file://") == 0) {
            // can't use loadURI for local links - that's ok, no need for referrer here
            browser.contentDocument.location.assign(url)
        } else {
            var referrerUrl = urlAndReferrer[1];
            browser.loadURI(url, makeURI(referrerUrl), null);
        }
        browser.imageForwardNextIndex = browser.imageForwardNextIndex + 1;
    },

    getURLsAndReferrers: function(documents) {
        var result = new Array()
        for(var documentIndex = 0; documentIndex < documents.length; documentIndex++) {
            var urls = gImageForward.matchURLs(documents[documentIndex].links);
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

    matchURLs: function(urls) {
        var result = new Array();
        var regexpPreferencesKey = "extensions.imageforward.linkRegExp";
        var regexpString = gImageForward.preferences.getCharPref(regexpPreferencesKey);
        var regexp = new RegExp(regexpString, "i");
        for(var index = 0; index < urls.length; index++) {
            var urlString = urls[index].toString();
            if (urlString.match(regexp) && result.indexOf(urlString) == -1) {
                result.push(urlString);
            }
        }
        return result;
    },

    addHistoryListener: function(browser) {
        console.log("AddHistoryListener");
        browser.sessionHistory.addSHistoryListener(gImageForward.historyListener(browser));
        browser.imageForwardListenerAdded = true;
    },

    historyListener: function(browser) {
        return {
            QueryInterface: XPCOMUtils.generateQI([
                Components.interfaces.nsISHistoryListener,
                Components.interfaces.nsISupports,
                Components.interfaces.nsISupportsWeakReference
            ]),

            OnHistoryGoBack: function () {
                console.log("HistoryGoBack");
                return true;
            },

            OnHistoryGoForward: function () {
                console.log("HistoryGoForward");
                return true;
            },

            OnHistoryGotoIndex: function () {
                console.log("HistoryGotoIndex");
                return true;
            },

            OnHistoryNewEntry: function () {
                console.log("HistoryNewEntry");
                return true;
            },

            OnHistoryPurge: function () {
                console.log("HistoryPurge");
                return true;
            },

            OnHistoryReload: function () {
                console.log("HistoryReload");
                return true;
            }
        }
    }
};

window.addEventListener('load', gImageForward.onLoad, false);

