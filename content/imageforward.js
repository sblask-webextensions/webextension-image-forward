var gImageForward = {

    onLoad: function() {
        if ('undefined' == typeof gBrowser) {
            return;
        }
        window.removeEventListener('load', gImageForward.onLoad, false);
        window.addEventListener('unload', gImageForward.onUnload, false);
        document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", gImageForward.onPopupShowing, false);
    },

    onUnload: function() {
        window.removeEventListener('unload', gImageForward.onUnload, false);
    },

    onPopupShowing: function(anEvent) {
        document.getElementById("imageForwardContextMenuItem").disabled = false;
    },

    onClick: function() {
        var urls = new Array();
        urls[0] = "http://www.test.com/";
        urls[1] = "http://www.test.de/";
        urls[2] = "http://www.test.com/";
        gImageForward.addURLsToHistoryAndAdvance(urls);
    },

    addURLsToHistoryAndAdvance: function(urls) {
        for (var index = 0; index < urls.length; index++) {
            var url = urls[index];
            gImageForward.addHistoryEntry(url, url, "http://www.nowhere.com");
        }
        // have to go back actually, because the history index is changed by
        // adding an entry while not loading it
        gBrowser.selectedBrowser.contentWindow.history.go(-urls.length + 1);
    },

    addHistoryEntry: function(title, uri, referrerURI) {
        var history = gBrowser.selectedBrowser.sessionHistory;
        history.QueryInterface(Components.interfaces.nsISHistoryInternal);
        history.maxLength = 99999;
        history.addEntry(gImageForward.makeHistoryEntry(title, uri, referrerURI), true);
    },

    makeURI: function(uriString) {
        var uriObject =
            Components
                .classes["@mozilla.org/network/standard-url;1"]
                .createInstance(Components.interfaces.nsIURI);
        uriObject.spec = uriString;
        return uriObject;
    },

    makeHistoryEntry: function(title, uri, referrerURI) {
        var historyEntry =
            Components
                .classes['@mozilla.org/browser/session-history-entry;1']
                .createInstance(Components.interfaces.nsISHEntry);
        historyEntry.setTitle(title);
        historyEntry.setURI(gImageForward.makeURI(uri));
        historyEntry.referrerURI = gImageForward.makeURI(referrerURI);
        return historyEntry;
    }

};

window.addEventListener('load', gImageForward.onLoad, false);

