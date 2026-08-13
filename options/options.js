import {OPTION_DEFAULTS} from "../option-defaults.js";

async function restoreOptions() {
    const result = await browser.storage.local.get(OPTION_DEFAULTS);
    setTextValue("linkedImagesRegexp", result.linkedImagesRegexp || "");
    maybeHighlightError(result.linkedImagesRegexp || "");
    setTextValue("minWidth", result.minWidth || "");
    setTextValue("minHeight", result.minHeight || "");
}

function enableAutosave() {
    for (const input of document.querySelectorAll("input:not([type=radio]):not([type=checkbox]), textarea")) {
        input.addEventListener("input", saveOptions);
    }
    for (const input of document.querySelectorAll("input[type=radio], input[type=checkbox]")) {
        input.addEventListener("change", saveOptions);
    }
}

function setTextValue(elementID, newValue) {
    const oldValue = document.getElementById(elementID).value;

    if (oldValue !== newValue) {
        document.getElementById(elementID).value = newValue;
    }
}

function getRegexpError(regexp) {
    try {
        new RegExp(regexp);
    } catch (error) {
        return error.message;
    }
    return undefined;
}

function maybeHighlightError(regexp) {
    const regexpElement = document.querySelector("#linkedImagesRegexp");
    const errorElement = document.querySelector("#linkedImagesRegexpError");
    const error = getRegexpError(regexp);
    regexpElement.classList.toggle("error", error !== undefined);
    errorElement.innerText = error || "";
}

async function saveOptions(event) {
    event.preventDefault();
    const linkedImagesRegexp = document.querySelector("#linkedImagesRegexp").value;
    maybeHighlightError(linkedImagesRegexp);
    await browser.storage.local.set({
        linkedImagesRegexp: linkedImagesRegexp,
        minWidth: document.querySelector("#minWidth").value,
        minHeight: document.querySelector("#minHeight").value,
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.addEventListener("DOMContentLoaded", enableAutosave);
document.querySelector("form").addEventListener("submit", saveOptions);

browser.storage.onChanged.addListener(restoreOptions);
