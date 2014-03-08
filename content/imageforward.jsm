Components.utils.import("resource://gre/modules/devtools/Console.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

EXPORTED_SYMBOLS = ["ImageForward"];

function ImageForward() {

    this.keyset = undefined;

    this.makeKeyset = function() {
        var namespace =
            "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        this.keyset =
            this.domWindow.document.createElementNS(namespace, "keyset");
        this.keyset.setAttribute("id", "imageforwardKeyset");
        var mainKeyset = this.domWindow.document.getElementById("mainKeyset");
        mainKeyset.parentNode.appendChild(this.keyset);
    };

    this.removeKeyboardShortcuts = function() {
        if (this.keyset) {
            this.keyset.parentNode.removeChild(this.keyset);
            this.keyset = undefined;
        }
    };

    this.makeKeyboardShortcutElement = function(id, keycode, modifiers, fun) {
        var element = this.domWindow.document.createElement("key");
        element.setAttribute("id", id);
        element.setAttribute("keycode", keycode);
        element.setAttribute("modifiers", modifiers);
        element.setAttribute("oncommand", "void(0);");
        element.addEventListener("command", fun, true);
        return element;
    };

    this.addKeyboardShortcuts = function() {
        this.makeKeyset();
        var iterateImagesElement =
            this.makeKeyboardShortcutElement(
                "imageforward-iterate-images",
                " ",
                "accel shift",
                this.iterateImages.bind(this)
            );
        this.keyset.appendChild(iterateImagesElement);
        var iterateImageLinksElement =
            this.makeKeyboardShortcutElement(
                "imageforward-iterate-image-links",
                " ",
                "accel",
                this.iterateImageLinks.bind(this)
            );
        this.keyset.appendChild(iterateImageLinksElement);
        var abortIterationElement =
            this.makeKeyboardShortcutElement(
                "imageforward-abort-iterations",
                "VK_ESCAPE",
                "accel shift",
                this.abortIteration.bind(this)
            );
        this.keyset.appendChild(abortIterationElement);
    };

    this.initialize = function(domWindow) {
        if (!domWindow || !domWindow.gBrowser) {
            return;
        }
        this.domWindow = domWindow;
        this.gBrowser = domWindow.gBrowser;

        this.addKeyboardShortcuts();
    };


    this.destroy = function() {
        if (!this.domWindow || !this.domWindow.gBrowser) {
            return;
        }
        this.removeKeyboardShortcuts();
    };

    this.iterateImages = function() {
        this.go(
            function(document){return document.images;},
            this.filterImages
        );
    };

    this.iterateImageLinks = function() {
        this.go(
            function(document){return document.links;},
            this.matchLinkURLs
        );
    };

    this.abortIteration = function() {
        this.backToStart(this.gBrowser.selectedBrowser);
    };

    this.go = function(extractorFunction, filterFunction) {
        var browser = this.gBrowser.selectedBrowser;
        if (!browser) {
            return;
        }
        if (!browser.imageForwardLinks) {
            var documents = this.getDocuments(browser);
            var urlsAndReferrers = this.urlsAndReferrers(
                documents,
                extractorFunction,
                filterFunction
            );
            if (urlsAndReferrers.length === 0) {
                return;
            }
            this.initializeVariables(browser, urlsAndReferrers);
        }
        // need to keep track of back/forward movements and new pages
        this.ensureHistoryListener(browser);
        this.ensureProgressListener(browser);
        // user went in back in history, just go forward in history
        if (browser.imageForwardHistoryAdjust < 0) {
            browser.contentWindow.history.forward();
            return;
        }
        var lastIndex = browser.imageForwardLinks.length - 1;
        if (browser.imageForwardNextIndex > lastIndex) {
            this.backToStart(browser);
            return;
        }
        this.loadNextImage(browser);
    };

    this.initializeVariables = function(browser, urlsAndReferrers) {
        browser.imageForwardLinks = urlsAndReferrers;
        browser.imageForwardNextIndex = 0;
        // track uses os back/forward function of browser
        browser.imageForwardHistoryAdjust = 0;
        // manually keep track of what is added to history as urls can skip
        // history when iterating to fast. `browser.imageForwardLinks.length`
        // would point to before the initial page then
        browser.imageForwardHistoryIndex = 0;
    };

    this.resetVariables = function(browser) {
        browser.imageForwardLinks = undefined;
        browser.imageForwardNextIndex = -1;
        browser.imageForwardHistoryAdjust = 0;
        browser.imageForwardHistoryIndex = 0;
    };

    this.backToStart = function(browser) {
        var backToStartAdjustment =
            -(browser.imageForwardHistoryIndex +
              browser.imageForwardHistoryAdjust);
        this.resetVariables(browser);
        browser.contentWindow.history.go(backToStartAdjustment);
    };

    this.getDocuments = function(browser) {
        var documents = [];
        documents.push(browser.contentWindow.document);
        var frames = browser.contentWindow.frames;
        for(var index = 0; index < frames.length; index++) {
            documents.push(frames[index].document);
        }
        return documents;
    };

    this.makeURI = function(aURL, aOriginCharset, aBaseURI) {
        var ioService =
            Components
                .classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
        return ioService.newURI(aURL, aOriginCharset, aBaseURI);
    };

    this.loadNextImage = function(browser) {
        var urlAndReferrer =
            browser.imageForwardLinks[browser.imageForwardNextIndex];
        var url = urlAndReferrer[0];
        // can't use loadURI for local urls - that's ok, no need for referrer
        if (url.indexOf("file://") === 0) {
            browser.contentDocument.location.assign(url);
        } else {
            var referrerURL = urlAndReferrer[1];
            browser.loadURI(url, this.makeURI(referrerURL), null);
        }
        browser.imageForwardNextIndex += 1;
    };

    this.urlsAndReferrers = function(documents, extractorFunction, filterFunction) {
        var result = [];
        for(var docIndex = 0; docIndex < documents.length; docIndex++) {
            var extractedThings = extractorFunction(documents[docIndex]);
            var urls = filterFunction(extractedThings);
            var referrer = documents[docIndex].URL;
            for(var urlIndex = 0; urlIndex < urls.length; urlIndex++) {
                result.push(this.makeTuple(urls[urlIndex], referrer));
            }
        }
        return result;
    };

    this.makeTuple = function(first, second) {
        var tuple = [];
        tuple.push(first);
        tuple.push(second);
        return tuple;
    };

    this.filterImages = function(images) {
        var result = [];
        var pattern = Services.prefs.getCharPref(
            "extensions.imageforward.imageURLRegExp"
        );
        var regexp = new RegExp(pattern, "i");
        var minHeight = Services.prefs.getIntPref(
            "extensions.imageforward.minHeight"
        );
        var minWidth = Services.prefs.getIntPref(
            "extensions.imageforward.minWidth"
        );
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
    };

    this.matchLinkURLs = function(urls) {
        var result = [];
        var pattern = Services.prefs.getCharPref(
            "extensions.imageforward.linkURLRegExp"
        );
        var regexp = new RegExp(pattern, "i");
        for(var index = 0; index < urls.length; index++) {
            var urlString = urls[index].toString();
            var isMatch = urlString.match(regexp);
            var isKnown = result.indexOf(urlString) >= 0;
            if (isMatch && !isKnown) {
                result.push(urlString);
            }
        }
        return result;
    };

    this.ensureProgressListener = function(browser) {
        if (browser.imageForwardProgressListener) {
            return;
        }
        var listener = this.progressListener(browser);
        // need to keep a reference, seems to be garbage collected otherwise
        browser.imageForwardProgressListener = listener;
        browser.addProgressListener(
            listener,
            Components.interfaces.nsIWebProgress.NOTIFY_LOCATION
        );
    };

    this.ensureHistoryListener = function(browser) {
        if (browser.imageForwardHistoryListener) {
            return;
        }
        var listener = this.historyListener(browser);
        // need to keep a reference, seems to be garbage collected otherwise
        browser.imageForwardHistoryListener = listener;
        browser.sessionHistory.addSHistoryListener(listener);
    };

    this.containsURL = function(urlsAndReferrers, url) {
        if (!urlsAndReferrers) {
            return false;
        }
        for(var index = 0; index < urlsAndReferrers.length; index++) {
            if (urlsAndReferrers[index][0] == url){
                return true;
            }
        }
        return false;
    };

    this.isBackToStart = function(browser) {
        var relativeIndex =
            browser.imageForwardHistoryIndex +
            browser.imageForwardHistoryAdjust;
        return relativeIndex <= 0;
    };

    this.historyListener = function(browser) {
        Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
        return {
            QueryInterface: XPCOMUtils.generateQI([
                Components.interfaces.nsISHistoryListener,
                Components.interfaces.nsISupports,
                Components.interfaces.nsISupportsWeakReference
            ]),

            OnHistoryGoBack: function (uri) {
                if (browser.imageForwardLinks){
                    browser.imageForwardHistoryAdjust -= 1;
                    if (this.isBackToStart(browser)) {
                        this.resetVariables(browser);
                    }
                }
                return true;
            }.bind(this),

            OnHistoryGoForward: function (uri) {
                if (browser.imageForwardLinks){
                    browser.imageForwardHistoryAdjust += 1;
                }
                return true;
            }.bind(this),

            OnHistoryGotoIndex: function (index, uri) {
                if (browser.imageForwardLinks){
                    var historyIndex = browser.sessionHistory.index;
                    browser.imageForwardHistoryAdjust = index - historyIndex;
                    if (this.isBackToStart(browser)) {
                        this.resetVariables(browser);
                    }
                }
                return true;
            }.bind(this),

            OnHistoryNewEntry: function (uri) {
                if (browser.imageForwardLinks){
                    browser.imageForwardHistoryIndex += 1;
                }
                return true;
            }.bind(this)
        };
    };

    this.progressListener = function(browser) {
        Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
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
                if (!this.containsURL(
                        browser.imageForwardLinks,
                        aRequest.originalURI.asciiSpec)
                    ) {
                    this.resetVariables(browser);
                }
            }.bind(this)
        };
    };
}

