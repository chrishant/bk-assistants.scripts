(async function POAutoSetup() {

    if (!location.href.includes("#/procurement/purchase-order")) {
        throw new Error("❌ Not on PO screen");
    }

    console.log("🚀 Starting Dynamic PO Setup...");

    /* =====================================================
       SUPPLIER ALIASES
    ====================================================== */

    const supplierAliasesRaw = {
        "BYWAYS INDIA PRIVATE LIMITED": ["BW", "BYW", "BY"],
        "AVERY DENNISON INDIA (PVT) LIMITED": ["AD", "DENN", "DEN"],
        "TRIMCO GROUP (HONG KONG) COMPANY LIMITED": [
            "THK", "TRIMCO HK", "TRIMCO GROUP HK"
        ],
        "INTERNATIONAL TRIMMINGS & LABELS INDIA P. LTD.": [
            "ITL", "IMM", "ITL INDIA",
            "INTERNATIONAL", "INTERNATIONAL TRIMMINGS"
        ]
    };

    const itemGroupAliasesRaw = {
        "PACKING": ["P", "PK", "PACK", "PACKING"],
        "TRIM": ["TRIMS", "TRIMMING", "TR", "T"],
        "FABRIC": ["FAB", "FABRICS", "F"]
    };

    function buildAliasMap(aliasObject) {
        const map = {};
        Object.entries(aliasObject).forEach(([fullName, aliases]) => {
            aliases.forEach(alias => {
                map[alias.replace(/\s+/g, "").toLowerCase()] = fullName;
            });
        });
        return map;
    }

    const supplierAliases = buildAliasMap(supplierAliasesRaw);
    const itemGroupAliases = buildAliasMap(itemGroupAliasesRaw);

    function resolveAlias(input, aliasMap) {
        const normalized = input.replace(/\s+/g, "").toLowerCase();
        return aliasMap[normalized] || input;
    }

    /* =====================================================
       USER INPUT
    ====================================================== */

    let supplierInput = prompt("Enter Supplier:");
    if (!supplierInput) throw new Error("❌ Supplier required");

    const supplierResolved = resolveAlias(supplierInput, supplierAliases);

    let itemGroupInput = prompt("Enter Item Group:");
    if (!itemGroupInput) throw new Error("❌ Item Group required");

    const itemGroupResolved = resolveAlias(itemGroupInput, itemGroupAliases);

    /* =====================================================
       UTILITIES
    ====================================================== */

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    async function waitUntil(conditionFn, timeout = 10000) {
        const start = Date.now();
        while (!conditionFn()) {
            if (Date.now() - start > timeout)
                throw new Error("❌ Timeout waiting");
            await wait(100);
        }
    }

    async function selectCustomDropdown(containerId, value) {

        const container = document.querySelector("#" + containerId);
        if (!container) throw new Error("❌ Dropdown not found: " + containerId);

        const toggle = container.querySelector(".dropdown-toggle");
        toggle.click();
        await wait(200);

        const searchInput =
            container.querySelector("#txtCustomSelectSearchText input");

        searchInput.value = value;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        searchInput.dispatchEvent(new Event("change", { bubbles: true }));

        await waitUntil(() =>
            [...container.querySelectorAll("ul li a")]
                .some(opt =>
                    opt.innerText.toLowerCase().includes(value.toLowerCase())
                )
        );

        const matched = [...container.querySelectorAll("ul li a")]
            .find(opt =>
                opt.innerText.toLowerCase().includes(value.toLowerCase())
            );

        matched.click();
    }

    /* =====================================================
       EXECUTION FLOW
    ====================================================== */

    await selectCustomDropdown("party_id", supplierResolved);
    await wait(2000);

    await selectCustomDropdown("ship_address_id", "C-122");
    await selectCustomDropdown("indent_type", "Production Order");
    await selectCustomDropdown("item_group_type", itemGroupResolved);
    await selectCustomDropdown("template_name", "Purchase Order");

    const addButton =
        document.querySelector("#detail_collapsible_panel_open_popup_po_dt");

    addButton.scrollIntoView({ block: "center" });
    await wait(300);
    addButton.click();

    /* =====================================================
       WAIT FOR MODAL + ANGULAR RENDER
    ====================================================== */

    await waitUntil(() =>
        document.querySelector(".modal-content")
    );

    console.log("✅ Modal Opened");

    // Wait until multi-select items actually render
    await waitUntil(() =>
        document.querySelectorAll("#manu_buyer_filter .multiSelectItem").length > 0
    );

    console.log("🔄 Multi-select rendered");

    /* =====================================================
       MULTI-SELECT SYNC (INDEX 5)
    ====================================================== */

    const selectedElement =
        document.querySelector('#item_group_type .dropdown-toggle span.ng-binding');

    if (!selectedElement) {
        console.warn("❌ Header value not found");
        return;
    }

    const currentItemGroup =
        selectedElement.innerText.trim();

    console.log("Header value:", currentItemGroup);

    const allButtons =
        document.querySelectorAll("#SelectedBuyerDropdown");

    if (allButtons.length <= 5) {
        console.warn("❌ Index 5 not found");
        return;
    }

    const btn = allButtons[5];

    btn.click();
    await wait(300);

    const container = btn.closest("#manu_buyer_filter");

    if (!container) {
        console.warn("❌ Container not found");
        return;
    }

    const items =
        [...container.querySelectorAll(".multiSelectItem")];

    // Clear previous selections safely
    items.forEach(el => {
        if (el.classList.contains("selected")) {
            el.click();
        }
    });

    await wait(150);

    const match = items.find(el =>
        el.innerText.trim().toLowerCase()
            .includes(currentItemGroup.toLowerCase())
    );

    if (match) {
        match.click();
        console.log("✅ Synced:", currentItemGroup);
    } else {
        console.warn("⚠ No match for:", currentItemGroup);
    }

    await wait(150);
    btn.click();

})();
