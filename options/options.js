function restoreOptions() {
    browser.storage.local.get([
        "linkedImagesRegexp",
        "minWidth",
        "minHeight",
    ], result => {
        document.querySelector("#linkedImagesRegexp").value = result.linkedImagesRegexp || "";
        document.querySelector("#minWidth").value = result.minWidth || "";
        document.querySelector("#minHeight").value = result.minHeight || "";
    });
}

function saveOptions(event) {
    event.preventDefault();
    browser.storage.local.set({
        linkedImagesRegexp: document.querySelector("#linkedImagesRegexp").value,
        minWidth: document.querySelector("#minWidth").value,
        minHeight: document.querySelector("#minHeight").value,
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

browser.storage.onChanged.addListener(restoreOptions);
