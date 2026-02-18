(async function(){
 if (!location.href.includes("#/procurement/receiving")) {
        throw new Error("❌ Not on Receiving screen");
    }
    function wait(ms){
        return new Promise(r => setTimeout(r, ms));
    }

    function waitForModal(checkFn, timeout = 10000){
        return new Promise((resolve, reject)=>{
            const start = Date.now();
            const interval = setInterval(()=>{
                const modal = document.body.lastElementChild;
                if (modal && checkFn(modal)) {
                    clearInterval(interval);
                    resolve(modal);
                }
                if (Date.now() - start > timeout){
                    clearInterval(interval);
                    reject("Modal not detected.");
                }
            }, 100);
        });
    }

    function showAlert(message, type = "success", duration = 7000) {
        let container = document.getElementById("centerTopValidationAlert");

        if (!container) {
            container = document.createElement("div");
            container.id = "centerTopValidationAlert";
            container.style.position = "fixed";
            container.style.top = "70px";
            container.style.left = "50%";
            container.style.transform = "translateX(-50%)";
            container.style.zIndex = "999999";
            container.style.pointerEvents = "none";
            document.body.appendChild(container);
        }

        const alertDiv = document.createElement("div");
        alertDiv.innerText = message;

        alertDiv.style.padding = "14px 26px";
        alertDiv.style.borderRadius = "10px";
        alertDiv.style.fontWeight = "600";
        alertDiv.style.fontSize = "14px";
        alertDiv.style.fontFamily = "Segoe UI, sans-serif";
        alertDiv.style.color = "white";
        alertDiv.style.textAlign = "center";
        alertDiv.style.boxShadow = "0 12px 30px rgba(0,0,0,0.25)";
        alertDiv.style.transform = "translateY(-20px)";
        alertDiv.style.opacity = "0";
        alertDiv.style.transition = "all 0.35s ease";
        alertDiv.style.background =
            type === "success" ? "#1e7e34" : "#c82333";

        container.appendChild(alertDiv);

        requestAnimationFrame(() => {
            alertDiv.style.transform = "translateY(0)";
            alertDiv.style.opacity = "1";
        });

        setTimeout(() => {
            alertDiv.style.opacity = "0";
            alertDiv.style.transform = "translateY(-20px)";
            setTimeout(() => alertDiv.remove(), 350);
        }, duration);
    }

    // ===============================
    // 1️⃣ SUPPLIER SELECTION
    // ===============================

    const supplierAliasMap = {
        "imm": "INTERNATIONAL TRIMMINGS",
        "itl": "INTERNATIONAL TRIMMINGS"
    };

    const supplierInput = prompt("Enter Supplier Alias or Name:");
    if (!supplierInput) return;

    const supplier =
        supplierAliasMap[supplierInput.toLowerCase().trim()] || supplierInput;

    document.querySelector("#search_party").click();

    const supplierModal = await waitForModal(modal =>
        modal.querySelector(".ui-grid-filter-input")
    );

    const filterInput = supplierModal.querySelector(".ui-grid-filter-input");
    const filterScope = angular.element(filterInput).scope();

    filterScope.$apply(function () {
        filterScope.colFilter.term = supplier;
    });

    await wait(1000);

    const rows = supplierModal.querySelectorAll(".ui-grid-row");
    if (!rows.length) return;

    rows[0]
      .querySelector(".ui-grid-selection-row-header-buttons")
      .click();

    await wait(800);

    // ===============================
    // 2️⃣ RECEIVE TYPE
    // ===============================

    const recvDropdown = document.querySelector("#recv_type");
    recvDropdown.querySelector(".dropdown-toggle").click();
    await wait(400);

    const recvOptions = recvDropdown.querySelectorAll("ul li a");

    const recvTarget = [...recvOptions].find(opt =>
        opt.innerText.trim().toLowerCase() === "material purchase"
    );

    if (!recvTarget) return;

    recvTarget.click();
    await wait(800);

    // ===============================
    // 3️⃣ OPEN GATE ENTRY
    // ===============================

    document.querySelector("#gate_record").click();
    await wait(1500);

    // ===============================
    // 4️⃣ SELECT GATE ENTRY
    // ===============================

    const gateValue = prompt("Enter Gate Entry Number:");
    if (!gateValue) return;

    const gateDropdown = document.querySelector("#gate_entry_id");
    gateDropdown.querySelector(".dropdown-toggle").click();
    await wait(700);

    let searchInput;
    for (let i = 0; i < 15; i++) {
        searchInput = gateDropdown.querySelector(".custom-select-search input");
        if (searchInput) break;
        await wait(200);
    }

    if (!searchInput) return;

    const gateScope = angular.element(searchInput).scope();
    gateScope.$apply(function () {
        gateScope.searchTerm = gateValue;
    });

    await wait(1200);

    const gateOptions = gateDropdown.querySelectorAll("ul li a");

    let match = [...gateOptions].find(opt =>
        opt.innerText.toLowerCase().includes(gateValue.toLowerCase())
    );

    if (!match && gateOptions.length) {
        match = gateOptions[0];
    }

    if (!match) return;

    match.click();
    await wait(1200);

    // ===============================
    // 5️⃣ SELECT ALL GRID
    // ===============================

    const buttons = document.querySelectorAll(
        ".ui-grid-selection-row-header-buttons"
    );

    if (buttons.length >= 3) {
        const gridScope = angular.element(buttons[2]).scope();
        gridScope.$apply(function(){
            gridScope.headerButtonClick();
        });
    }

    await wait(800);

    // ===============================
    // 6️⃣ CLICK OK & CLOSE
    // ===============================

    let okBtn;
    for (let i = 0; i < 20; i++) {
        okBtn = document.querySelector("#sub_screen_ok");
        if (okBtn && !okBtn.disabled) break;
        await wait(200);
    }

    if (!okBtn) return;

    okBtn.click();
    await wait(2000);

    // ===============================
    // 7️⃣ VALIDATION
    // ===============================

    const qtyInput = prompt("Enter Expected Quantity:");
    const amountInput = prompt("Enter Expected Amount:");
    if (!qtyInput || !amountInput) return;

    const expectedQty = parseFloat(qtyInput);
    const expectedAmount = parseFloat(amountInput);

    const footer = document.querySelector(".settotalfooter");
    const receiveField = document.querySelector("#receive_amount");
    const billField = document.querySelector("#bill_amount");

    if (!footer || !receiveField || !billField) {
        showAlert("Validation fields not found.", "error");
        return;
    }

    const actualQty = parseFloat(
        footer.innerText.match(/([\d\.]+)/)[1]
    );

    const receiveAmount = parseFloat(receiveField.value.replace(/,/g, ""));
    const billAmount = parseFloat(billField.value.replace(/,/g, ""));

    const qtyValid = Math.abs(expectedQty - actualQty) < 0.001;

    function isWithinFloorCeil(actual) {
        const min = Math.floor(actual);
        const max = Math.ceil(actual);
        return expectedAmount >= min && expectedAmount <= max;
    }

    const receiveValid = isWithinFloorCeil(receiveAmount);
    const billValid = isWithinFloorCeil(billAmount);

    const allValid = qtyValid && receiveValid && billValid;

showAlert(
    `Qty:${qtyValid ? "✔" : "✖"} | Rec:${receiveValid ? "✔" : "✖"} | Bill:${billValid ? "✔" : "✖"}`,
    allValid ? "success" : "error",
    7000
);
async function runAddChargesScript(){

    function wait(ms){
        return new Promise(r => setTimeout(r, ms));
    }

    var addBtn = document.querySelector("#detail_collapsible_panel_open_popup_receive_other_charges_dt");

    if (!addBtn) {
        console.log("Add Other Charges button not found.");
        return false;
    }

    addBtn.click();
    console.log("Opening Additional Charges modal...");
    await wait(800);

    var typeDropdownList = document.querySelectorAll("#account_id");
    var typeDropdown = typeDropdownList[typeDropdownList.length - 1];

    if (!typeDropdown) {
        console.log("Charge Type dropdown not found.");
        return false;
    }

    var modal = typeDropdown.closest(".modal-content");

    const chargeAliasMap = {
        "bc": "BANK CHARGES",
        "fc": "FREIGHT AND CARTAGE",
        "disc": "DISCOUNT"
    };

    var userInput = prompt("Enter Charge Type Alias (bc, fcn, discn etc):");
    if (!userInput) return false;

    var cleaned = userInput.trim().toLowerCase();
    var isNotTaxable = cleaned.endsWith("n");

    if (isNotTaxable) {
        cleaned = cleaned.slice(0, -1);
    }

    var chargeType = chargeAliasMap[cleaned] || cleaned.toUpperCase();

    var amount = prompt("Enter Charge Amount:");
    if (!amount) return false;

    typeDropdown.querySelector(".dropdown-toggle").click();
    await wait(400);

    var searchInput = typeDropdown.querySelector("input[type='text']");
    if (searchInput) {
        var searchScope = angular.element(searchInput).scope();
        searchScope.$apply(function(){
            searchScope.searchTerm = chargeType;
        });
    }

    await wait(800);

    var options = typeDropdown.querySelectorAll("ul li a");

    var target = [...options].find(opt =>
        opt.innerText.trim().toLowerCase() === chargeType.toLowerCase()
    );

    if (!target) {
        console.log("Charge type not found in dropdown.");
        return false;
    }

    target.click();
    await wait(400);

    var amountInputs = modal.querySelectorAll("#charge_value");
    var amountInput = amountInputs[amountInputs.length - 1];
    var scope = angular.element(amountInput).scope();

    scope.$apply(function(){
        scope.popup_model.charge_value = amount;
    });

    await wait(400);

    if (isNotTaxable) {

        var taxDropdownList = modal.querySelectorAll("#is_tax");
        var taxDropdown = taxDropdownList[taxDropdownList.length - 1];

        taxDropdown.querySelector(".dropdown-toggle").click();
        await wait(400);

        var taxOptions = taxDropdown.querySelectorAll("ul li a");

        var noOption = [...taxOptions].find(opt =>
            opt.innerText.trim().toLowerCase() === "no"
        );

        if (noOption) noOption.click();

        await wait(400);
    }

    var buttons = modal.querySelectorAll("button");

    var okCloseBtn = [...buttons].find(btn =>
        btn.innerText.trim().toLowerCase() === "ok & close"
    );

    if (!okCloseBtn) {
        console.log("Ok & Close button not found.");
        return false;
    }

    okCloseBtn.click();

    console.log("Additional Charge added successfully.");
    return true;
}

if (!allValid) {

    await wait(1000);

    const decision = prompt(
        "Values are not matching.\nWould You Want to Add Charges?\nType YES to continue:"
    );

    if (!decision || decision.trim().toLowerCase() !== "yes") {
        showAlert("Process stopped due to mismatch.", "error", 5000);
        return;
    }

    showAlert("Opening Add Charges...", "success", 4000);

    const added = await runAddChargesScript();

    if (!added) {
        showAlert("Charges were not added.", "error", 5000);
        return;
    }

    // ✅ WAIT FOR SYSTEM TO RECALCULATE
    await wait(1500);

    // 🔁 RE-VALIDATE AGAIN
    const newReceiveAmount = parseFloat(
        document.querySelector("#receive_amount").value.replace(/,/g, "")
    );

    const newBillAmount = parseFloat(
        document.querySelector("#bill_amount").value.replace(/,/g, "")
    );

    const newReceiveValid = isWithinFloorCeil(newReceiveAmount);
    const newBillValid = isWithinFloorCeil(newBillAmount);

    const newAllValid = newReceiveValid && newBillValid;

    showAlert(
        `After Charges → Rec:${newReceiveValid ? "✔" : "✖"} | Bill:${newBillValid ? "✔" : "✖"}`,
        newAllValid ? "success" : "error",
        6000
    );

    if (!newAllValid) {
        showAlert("Still not matching. Stopping process.", "error", 6000);
        return;
    }

    // ✅ If valid now → DO NOT RETURN
    showAlert("Amounts matched. Continuing...", "success", 4000);
}


// ===============================
// 🔹 SELECT STORE
// ===============================

const storeDropdown = document.querySelector("#stores");
if (!storeDropdown) {
    showAlert("Store dropdown not found.", "error");
    return;
}

storeDropdown.querySelector(".dropdown-toggle").click();
await wait(500);

const storeOptions = storeDropdown.querySelectorAll("ul li a");

const storeMatch = [...storeOptions].find(opt =>
    opt.innerText.trim().toLowerCase() === "acc. store c-122"
);

if (!storeMatch) {
    showAlert("ACC. STORE C-122 not found.", "error");
    return;
}

storeMatch.click();
await wait(600);

// ===============================
// 🔹 CLICK APPLY
// ===============================

let applyBtn;
for (let i = 0; i < 15; i++) {
    applyBtn = document.querySelector("#apply");
    if (applyBtn && !applyBtn.disabled) break;
    await wait(200);
}

if (!applyBtn) {
    showAlert("Apply button not found.", "error");
    return;
}

applyBtn.click();
await wait(1000);

    // ===============================
    // 8️⃣ ASK USER TO SAVE
    // ===============================

    const saveDecision = prompt("All validations passed.\nType YES to Save:");
    if (!saveDecision || saveDecision.trim().toLowerCase() !== "yes") {
        showAlert("Save Cancelled by User.", "error", 4000);
        return;
    }

    // ===============================
    // 9️⃣ CLICK SAVE
    // ===============================

    let saveBtn;
    for (let i = 0; i < 20; i++) {
        saveBtn = document.querySelector("#Save");
        if (saveBtn && !saveBtn.disabled) break;
        await wait(200);
    }

    if (!saveBtn) return;

    saveBtn.click();

    // ===============================
    // 🔟 CONFIRM SAVE MODAL
    // ===============================

    let confirmBtn;
    for (let i = 0; i < 20; i++) {
        confirmBtn = document.querySelector("#confirm_ok");
        if (confirmBtn && confirmBtn.offsetParent !== null) break;
        await wait(200);
    }

    if (!confirmBtn) return;

    confirmBtn.click();

    showAlert("Record Saved Successfully ✔", "success", 6000);

})();
