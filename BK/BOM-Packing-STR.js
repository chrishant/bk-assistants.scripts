function waitFor(selector, timeout = 8000) {
    return new Promise((resolve, reject) => {
        const interval = 200;
        let elapsed = 0;

        const timer = setInterval(() => {
            const el = document.querySelector(selector);
            if (el) {
                clearInterval(timer);
                resolve(el);
            }
            elapsed += interval;
            if (elapsed >= timeout) {
                clearInterval(timer);
                reject("Not found: " + selector);
            }
        }, interval);
    });
}

function waitForItems(timeout = 4000) {
    return new Promise((resolve) => {
        const interval = 200;
        let elapsed = 0;

        const timer = setInterval(() => {
            const items = document.querySelectorAll(".multiSelectItem label");
            if (items.length > 0) {
                clearInterval(timer);
                resolve(items);
            }
            elapsed += interval;
            if (elapsed >= timeout) {
                clearInterval(timer);
                resolve([]);
            }
        }, interval);
    });
}

function triggerAngularInput(el, value) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
}

async function openAndSelectSticker() {

    // 🔹 Ask user
    const code = prompt("Enter Item Code (BS / CS / TPT)");
    if (!code) return;

    const mapping = {
        BS: "BARCODE STICKER",
        CS: "CARTON STICKER",
        TPT: "TPT STICKER",
        PS: "POLYBAG STICKER"
    };

    const targetText = mapping[code.toUpperCase()];
    if (!targetText) {
        alert("Invalid code");
        return;
    }

    // 🔹 Activate first grid cell (adjust row if needed)
    const cell = document.querySelector(".ui-grid-row .ui-grid-cell");
    if (!cell) {
        console.log("Grid cell not found");
        return;
    }

    cell.click();
    cell.focus();

    // 🔹 Wait for drill component
    const drill = await waitFor(".drill-search-ui-grid");

    // 🔹 Open dropdown
    const btn = drill.querySelector(".ui-custom-drill-dropdown-btn");
    btn.click();

    // 🔹 Wait for search input
    const input = await waitFor('input[id^="readTxt-"]');

    // 🔹 First attempt
    triggerAngularInput(input, targetText);

    let items = await waitForItems();

    // 🔹 Retry if empty
    if (items.length === 0) {
        triggerAngularInput(input, "");
        await new Promise(r => setTimeout(r, 300));
        triggerAngularInput(input, targetText);
        items = await waitForItems();
    }

    // 🔹 Exact match selection
    let found = false;

    items.forEach(label => {
        if (label.innerText.trim().toUpperCase() === targetText) {
            label.closest(".multiSelectItem").click();
            found = true;
        }
    });

    if (!found) {
        alert("Exact item not found: " + targetText);
    } else {
        console.log("Selected:", targetText);
    }
}

openAndSelectSticker();
