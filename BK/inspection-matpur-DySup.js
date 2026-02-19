(async function(){

    if (!location.href.includes("#/procurement/inspection")) {
        throw new Error("❌ Not on Inspection screen");
    }

    function wait(ms){
        return new Promise(r => setTimeout(r, ms));
    }

    function waitForTargetModal(timeout = 15000){
        return new Promise((resolve, reject)=>{
            const start = Date.now();

            const interval = setInterval(()=>{
                const modals = document.querySelectorAll(".modal");

                if (modals.length > 2) {
                    const target = modals[2];
                    if (target.querySelector("#recv_id")) {
                        clearInterval(interval);
                        resolve(target);
                        return;
                    }
                }

                if (Date.now() - start > timeout){
                    clearInterval(interval);
                    reject("❌ Target modal not detected.");
                }

            }, 80);
        });
    }

    async function typeLikeHuman(el, text, wpm = 80){
        const charsPerSecond = (wpm * 5) / 60;
        const delay = 1000 / charsPerSecond;

        el.focus();
        el.value = "";

        for (let char of text){
            el.value += char;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            await wait(delay);
        }
    }

    // ===============================
    // 1️⃣ SUPPLIER
    // ===============================

    const supplierInput = prompt("Enter Supplier Name:");
    if (!supplierInput) return;

    const supplierDropdown = document.querySelector("#party_id");
    supplierDropdown.querySelector(".dropdown-toggle").click();
    await wait(400);

    const supplierSearch = document.querySelector("#txtCustomSelectSearchText input");
    const supplierScope = angular.element(supplierSearch).scope();

    supplierScope.$apply(()=> supplierScope.searchTerm = supplierInput);
    await wait(800);

    const supplierMatch = [...document.querySelectorAll("li.vs-repeat-repeated-element a")]
        .find(opt => opt.innerText.toLowerCase().includes(supplierInput.toLowerCase()));

    if (!supplierMatch){
        alert("Supplier not found.");
        return;
    }

    supplierMatch.click();
    await wait(500);

    console.log("✅ Supplier selected");

    // ===============================
    // 2️⃣ INSPECTION TYPE
    // ===============================

    const inspDropdown = document.querySelector("#insp_type");
    inspDropdown.querySelector(".dropdown-toggle").click();
    await wait(300);

    const inspMatch = [...inspDropdown.querySelectorAll("li.vs-repeat-repeated-element a")]
        .find(opt => opt.innerText.trim().toLowerCase() === "material purchase");

    if (!inspMatch){
        alert("Material Purchase not found.");
        return;
    }

    inspMatch.click();
    await wait(400);

    console.log("✅ Inspection Type selected");

    // ===============================
    // 3️⃣ CLICK +
    // ===============================

    document.querySelector("#detail_collapsible_panel_open_popup_inspection_dt").click();

    console.log("⏳ Waiting for inspection modal...");
    const modal = await waitForTargetModal();
    console.log("✅ Modal ready");

    // ===============================
// 4️⃣ RECEIVE NO (USER INPUT)
// ===============================

const receiveInput = prompt("Enter Receive No (full or last digits):");
if (!receiveInput) return;

const receiveValue = receiveInput.includes("/")
    ? receiveInput.split("/").pop()
    : receiveInput;

const recvControl = modal.querySelector("#recv_id");
const toggle = recvControl.querySelector(".dropdown-toggle");

angular.element(toggle).triggerHandler("click");

// 🔥 WAIT UNTIL BASE RECEIVE DATA LOADS
let baseLoaded = false;

for (let i = 0; i < 200; i++) {

    const baseOptions = recvControl.querySelectorAll("li.vs-repeat-repeated-element a");

    if (baseOptions.length > 0) {
        baseLoaded = true;
        break;
    }

    await wait(50);
}

if (!baseLoaded)
    throw new Error("Receiving list did not load.");

console.log("📦 Base receiving list loaded");

// Now wait for search input
let searchInput;
for (let i = 0; i < 100; i++) {
    searchInput = recvControl.querySelector("#txtCustomSelectSearchText input");
    if (searchInput) break;
    await wait(50);
}

if (!searchInput)
    throw new Error("Receive search input not found.");


// 🔥 HUMAN TYPING
await typeLikeHuman(searchInput, receiveValue, 80);
console.log("⌨ Typed at 80 WPM");

// Wait for filtered results
let options;
for (let i = 0; i < 150; i++) {

    options = recvControl.querySelectorAll("li.vs-repeat-repeated-element a");

    if ([...options].some(opt =>
        opt.innerText.toLowerCase().includes(receiveValue.toLowerCase())
    )) {
        break;
    }

    await wait(60);
}

if (!options || !options.length)
    throw new Error("No Receive options found.");

const match = [...options]
    .find(opt =>
        opt.innerText.toLowerCase().includes(receiveValue.toLowerCase())
    );

if (!match)
    throw new Error("Matching Receive not found.");

match.click();

console.log("🎉 Receive selected successfully.");
// ===============================
// 5️⃣ CLICK SEARCH BUTTON
// ===============================

// Scope strictly inside modal
const searchControl = modal.querySelector('[admincontrol="popup_model.search"]');
if (!searchControl)
    throw new Error("Search control not found inside modal.");

const searchBtn = searchControl.querySelector("#search");
if (!searchBtn)
    throw new Error("Search button not found.");

// Angular-safe click
angular.element(searchBtn).triggerHandler("click");

console.log("🔍 Search button clicked successfully.");
// ===============================
// 6️⃣ WAIT FOR GRID DATA
// ===============================

console.log("⏳ Waiting for grid rows to load...");

let rowsLoaded = false;

for (let i = 0; i < 300; i++) {   // ~18 seconds max
    const rows = modal.querySelectorAll(".ui-grid-row");
    if (rows.length > 0) {
        rowsLoaded = true;
        break;
    }
    await wait(60);
}

if (!rowsLoaded) {
    throw new Error("❌ Grid rows did not load.");
}

console.log("✅ Grid rows detected");


// ===============================
// 7️⃣ SELECT ALL GRID ROWS (Safe)
// ===============================

console.log("🚀 Selecting all rows...");

const viewport = modal.querySelector(
    ".ui-grid-render-container-left .ui-grid-viewport"
);

let lastScrollTop = -1;
const step = 400;

while (true){

    const checkboxes = modal.querySelectorAll(
        ".ui-grid-render-container-left .ui-grid-viewport .ui-grid-canvas .ui-grid-selection-row-header-buttons"
    );

    for (let cb of checkboxes){
        if (!cb.classList.contains("ui-grid-row-selected")){
            cb.click();
        }
    }

    viewport.scrollTop += step;
    await wait(180);

    if (viewport.scrollTop === lastScrollTop){
        break;
    }

    lastScrollTop = viewport.scrollTop;
}

// Final safety pass
const finalCheckboxes = modal.querySelectorAll(
    ".ui-grid-render-container-left .ui-grid-viewport .ui-grid-canvas .ui-grid-selection-row-header-buttons"
);

for (let cb of finalCheckboxes){
    if (!cb.classList.contains("ui-grid-row-selected")){
        cb.click();
    }
}

console.log("🎉 All rows selected successfully.");

// ===============================
// CLICK OK (INDEX BASED)
// ===============================

// Get all modals
const modals = document.querySelectorAll(".modal");

if (modals.length < 3)
    throw new Error("❌ Target modal index not found.");

// Your confirmed target modal (Index 2)
const targetModal = modals[2];

// Get buttons with duplicate ID inside this modal only
const okButtons = targetModal.querySelectorAll("#sub_screen_ok");

if (!okButtons.length)
    throw new Error("❌ OK buttons not found inside target modal.");

// If target is first one in node list
const okBtn = okButtons[1];

// Wait until enabled
for (let i = 0; i < 100; i++) {
    if (!okBtn.disabled) break;
    await new Promise(r => setTimeout(r, 40));
}

if (okBtn.disabled)
    throw new Error("❌ OK button still disabled.");

// Angular-safe click
angular.element(okBtn).triggerHandler("click");

console.log("🎉 OK clicked successfully.");
// ===============================
// 9️⃣ QUANTITY VALIDATION + SAVE
// ===============================

console.log("⏳ Waiting for footer totals...");

let footerCells;
for (let i = 0; i < 200; i++) {

    footerCells = document.querySelectorAll(".settotalfooter");

    if (footerCells.length >= 2) break;

    await wait(50);
}

if (!footerCells || footerCells.length < 2) {
    console.error("❌ Footer totals not found.");
    return;
}

// Extract numeric value safely
function extractQty(el){
    const match = el.innerText.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
}

const footerQty1 = extractQty(footerCells[0]);
const footerQty2 = extractQty(footerCells[1]);

console.log("Footer Qty 1:", footerQty1);
console.log("Footer Qty 2:", footerQty2);

// Ask user for expected quantity
const userQtyInput = prompt("Enter Expected Total Quantity:");
if (!userQtyInput) return;

const userQty = parseFloat(userQtyInput);

if (isNaN(userQty)){
    alert("❌ Invalid quantity entered.");
    return;
}

// ===============================
// VALIDATION
// ===============================

if (userQty !== footerQty1){
    alert("❌ User quantity does NOT match first footer total.");
    return;
}

if (footerQty1 !== footerQty2){
    alert("❌ Footer totals do NOT match.");
    return;
}

console.log("✅ Quantity validation passed.");

// ===============================
// CLICK SAVE
// ===============================

const saveBtn = document.querySelector("#Save");

if (!saveBtn){
    console.error("❌ Save button not found.");
    return;
}

// Wait until enabled
for (let i = 0; i < 100; i++){
    if (!saveBtn.disabled) break;
    await wait(50);
}

if (saveBtn.disabled){
    console.error("❌ Save button still disabled.");
    return;
}

// Angular-safe click
angular.element(saveBtn).triggerHandler("click");

console.log("💾 Save clicked successfully.");


})();
