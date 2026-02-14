(async function(){

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

    if (!allValid) return;

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
