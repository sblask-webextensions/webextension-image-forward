function restoreOptions() {
    browser.storage.local.get([
        "linkedImagesRegexp",
        "minWidth",
        "minHeight",
    ]).then(
        result => {
            document.querySelector("#linkedImagesRegexp").value = result.linkedImagesRegexp || "";
            document.querySelector("#minWidth").value = result.minWidth || "";
            document.querySelector("#minHeight").value = result.minHeight || "";
        }
    );
}

function enableAutosave() {
    for (let input of document.querySelectorAll("input:not([type=radio]):not([type=checkbox]), textarea")) {
        input.addEventListener("input", saveOptions);
    }
    for (let input of document.querySelectorAll("input[type=radio], input[type=checkbox]")) {
        input.addEventListener("change", saveOptions);
    }
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
document.addEventListener("DOMContentLoaded", enableAutosave);
document.querySelector("form").addEventListener("submit", saveOptions);

browser.storage.onChanged.addListener(restoreOptions);
