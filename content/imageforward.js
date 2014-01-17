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
        var documentURLs = gImageForward.getURLs(gImageForward.getDocuments());
        for(var index = 0; index < documentURLs.length; index++) {
            var urlsAndReferrer = documentURLs[index];
            gImageForward.addURLsToHistoryAndAdvance(urlsAndReferrer[0], urlsAndReferrer[1]);
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

    getURLs: function(documents) {
        var result = new Array()
        for(var index = 0; index < documents.length; index++) {
            var tuple = new Array();
            tuple.push(gImageForward.matchURLs(documents[index].links));
            tuple.push(documents[index].URL);
            result.push(tuple);
        }
        return result;
    },

    matchURLs: function(urls) {
        var result = new Array();
        var regexp = new RegExp("[^\?]+\.jpg$", "i");
        for(var index = 0; index < urls.length; index++) {
            var urlString = urls[index].toString();
            if (urlString.match(regexp)) {
                result.push(urls[index].toString());
            }
        }
        return result;
    },

    addURLsToHistoryAndAdvance: function(urls, referrer) {
        for (var index = 0; index < urls.length; index++) {
            var url = urls[index];
            gImageForward.addHistoryEntry("" + index, url, referrer);
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

