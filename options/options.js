function restoreOptions() {
    browser.storage.local.get([
        "linkedImagesRegexp",
        "minWidth",
        "minHeight",
    ]).then(
        result => {
            setTextValue("linkedImagesRegexp", result.linkedImagesRegexp || "");
            setTextValue("minWidth", result.minWidth || "");
            setTextValue("minHeight", result.minHeight || "");
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

function setTextValue(elementID, newValue) {
    let oldValue = document.getElementById(elementID).value;

    if (oldValue !== newValue) {
        document.getElementById(elementID).value = newValue;
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
