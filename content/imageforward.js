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
        document.getElementById("imageForwardContextMenuItem").disabled = !gContextMenu.onImage;
    },

    onClick: function() {
    }

};

window.addEventListener('load', gImageForward.onLoad, false);

