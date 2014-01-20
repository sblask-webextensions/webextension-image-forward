var gImageForward = {

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
        var documents = gImageForward.getDocuments();
        var urlsAndReferrers = gImageForward.getURLsAndReferrers(documents);
        gImageForward.addURLsToHistoryAndAdvance(urlsAndReferrers);
    },

    getDocuments: function() {
        var documents = new Array();
        documents.push(gBrowser.selectedBrowser.contentWindow.document);
        for(var index = 0; index < gBrowser.selectedBrowser.contentWindow.frames.length; index++) {
            documents.push(gBrowser.selectedBrowser.contentWindow.frames[index].document);
        }
        return documents;
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
        var regexp = new RegExp("[^\?]+\.(jpg|png)$", "i");
        for(var index = 0; index < urls.length; index++) {
            var urlString = urls[index].toString();
            if (urlString.match(regexp) && result.indexOf(urlString) == -1) {
                result.push(urlString);
            }
        }
        return result;
    },

    addURLsToHistoryAndAdvance: function(urlsAndReferrers) {
        for (var index = 0; index < urlsAndReferrers.length; index++) {
            var url = urlsAndReferrers[index][0];
            var title = url.split('?')[0].split('/').pop();
            var referrer = urlsAndReferrers[index][1];
            var historyEntry = gImageForward.makeHistoryEntry(title, url, referrer)
            gImageForward.history().addEntry(historyEntry, true);
        }
        // have to go back actually, because the history index is changed by
        // adding an entry while not loading it
        gBrowser.selectedBrowser.contentWindow.history.go(-urlsAndReferrers.length + 1);
    },

    history: function() {
        var history = gBrowser.selectedBrowser.sessionHistory;
        history.QueryInterface(Components.interfaces.nsISHistoryInternal);
        history.maxLength = 99999;
        return history;
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
    },
    
    // for debugging only
    printHistory: function() {
        var historyEntries = new Array()
        for (var index = 0; index < gImageForward.history().count; index++) {
            historyEntries.push(gImageForward.history().getEntryAtIndex(index, false).URI.asciiSpec);
        }
        console.log(historyEntries);
    }

};

window.addEventListener('load', gImageForward.onLoad, false);

