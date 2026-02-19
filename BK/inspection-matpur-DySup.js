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

    // wait for search input inside modal
    let searchInput;
    for (let i = 0; i < 100; i++){
        searchInput = recvControl.querySelector("#txtCustomSelectSearchText input");
        if (searchInput) break;
        await wait(50);
    }

    if (!searchInput) throw new Error("Receive search input not found.");

    await typeLikeHuman(searchInput, receiveValue, 80);
    console.log("⌨ Typed at 80 WPM");

    // wait for dropdown options
    let options;
    for (let i = 0; i < 100; i++){
        options = recvControl.querySelectorAll("li.vs-repeat-repeated-element a");
        if (options.length > 0) break;
        await wait(80);
    }

    if (!options || !options.length)
        throw new Error("No Receive options found.");

    const match = [...options]
        .find(opt => opt.innerText.toLowerCase().includes(receiveValue.toLowerCase()));

    if (!match)
        throw new Error("Matching Receive not found.");

    match.click();

    console.log("🎉 Receive selected successfully.");

})();
