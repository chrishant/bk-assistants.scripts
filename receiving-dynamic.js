(function(){

    function onPageReady(callback) {
        if (document.readyState === "complete") {
            callback();
        } else {
            window.addEventListener("load", callback);
        }
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

    onPageReady(async function(){

        const supplierAliasMap = {
            "imm": "INTERNATIONAL TRIMMINGS",
            "itl": "INTERNATIONAL TRIMMINGS"
        };

        // ===================================
        // 1️⃣ SUPPLIER SELECTION
        // ===================================

        var userInput = prompt("Enter Supplier Alias or Name:");
        if (!userInput) return;

        var supplier = supplierAliasMap[userInput.toLowerCase().trim()] || userInput;
        console.log("Resolved Supplier:", supplier);

        document.querySelector("#search_party").click();

        var supplierModal = await waitForModal(modal =>
            modal.querySelector(".ui-grid-filter-input")
        );

        var input = supplierModal.querySelector(".ui-grid-filter-input");
        var scope = angular.element(input).scope();

        scope.$apply(function () {
            scope.colFilter.term = supplier;
        });

        await wait(1000);

        var rows = supplierModal.querySelectorAll(".ui-grid-row");

        if (!rows.length) {
            console.log("No supplier rows found.");
            return;
        }

        var checkbox = rows[0].querySelector(".ui-grid-selection-row-header-buttons");
        checkbox.click();

        console.log("Supplier selected.");

        await wait(800);

        // ===================================
        // 2️⃣ RECEIVE TYPE SELECTION
        // ===================================

        var dropdown = document.querySelector("#recv_type");
        if (!dropdown) {
            console.log("Receive Type dropdown not found.");
            return;
        }

        dropdown.querySelector(".dropdown-toggle").click();
        await wait(400);

        var options = dropdown.querySelectorAll("ul li a");

        var target = [...options].find(opt =>
            opt.innerText.trim().toLowerCase() === "material purchase"
        );

        if (!target) {
            console.log("Receive Type option not found.");
            return;
        }

        target.click();

        console.log("Receive Type selected.");

        await wait(800);

        // ===================================
        // 3️⃣ OPEN GATE ENTRY RECORD
        // ===================================

        var gateBtn = document.querySelector("#gate_record");
        if (!gateBtn) {
            console.log("Gate Entry button not found.");
            return;
        }

        gateBtn.click();

        console.log("Gate Entry Record opened.");

    });

})();
