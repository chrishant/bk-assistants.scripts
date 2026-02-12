(async function POAutoSetup() {

    if (!location.href.includes("#/procurement/purchase-order")) {
        throw new Error("❌ Not on PO screen");
    }

    console.log("🚀 Starting Dynamic PO Setup...");

    /* =====================================================
       SUPPLIER ALIASES
    ====================================================== */

    const supplierAliasesRaw = {

        "BYWAYS INDIA PRIVATE LIMITED": [
            "BW", "BYW", "BY"
        ],
         "AVERY DENNISON INDIA (PVT) LIMITED": [
            "AD", "DENN", "DEN"
        ],

        "TRIMCO GROUP (HONG KONG) COMPANY LIMITED": [
            "THK", "TRIMCO HK", "TRIMCO GROUP HK"
        ],

        "INTERNATIONAL TRIMMINGS & LABELS INDIA P. LTD.": [
            "ITL", "IMM", "ITL INDIA", "INTERNATIONAL",
            "INTERNATIONAL TRIMMINGS"
        ]
    };

    /* =====================================================
       ITEM GROUP ALIASES
       (Customize based on your system values)
    ====================================================== */

    const itemGroupAliasesRaw = {

        "PACKING": [
            "P", "PK", "PACK", "PACKING"
        ],

        "TRIM": [
            "TRIMS", "TRIMMING", "TR", "T"
        ],

        "FABRIC": [
            "FAB", "FABRICS", "F"
        ]
    };

    /* =====================================================
       NORMALIZATION ENGINE
    ====================================================== */

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

    let supplierInput = prompt("Enter Supplier (alias or full name):");
    if (!supplierInput) throw new Error("❌ Supplier is required");

    const supplierResolved = resolveAlias(supplierInput, supplierAliases);
    console.log("Supplier Resolved To:", supplierResolved);

    let itemGroupInput = prompt("Enter Item Group (alias or full name):");
    if (!itemGroupInput) throw new Error("❌ Item Group is required");

    const itemGroupResolved = resolveAlias(itemGroupInput, itemGroupAliases);
    console.log("Item Group Resolved To:", itemGroupResolved);

    /* =====================================================
       UTILITIES
    ====================================================== */

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    async function waitUntil(conditionFn, timeout = 10000) {
        const start = Date.now();
        while (!conditionFn()) {
            if (Date.now() - start > timeout) {
                throw new Error("❌ Timeout waiting");
            }
            await wait(100);
        }
    }

    async function selectCustomDropdown(containerId, value) {

        const container = document.querySelector("#" + containerId);
        if (!container) throw new Error("❌ Dropdown not found: " + containerId);

        const toggle = container.querySelector(".dropdown-toggle");
        if (!toggle) throw new Error("❌ Dropdown toggle missing");

        toggle.click();
        await wait(200);

        const searchInput =
            container.querySelector("#txtCustomSelectSearchText input");

        if (!searchInput) throw new Error("❌ Search input not found");

        searchInput.focus();
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

        if (!matched) throw new Error("❌ Value not found: " + value);

        matched.click();
    }

    /* =====================================================
       EXECUTION FLOW
    ====================================================== */

    await selectCustomDropdown("party_id", supplierResolved);

    console.log("⏳ Waiting for supplier rebind...");
    await wait(2000);

    await selectCustomDropdown("ship_address_id", "C-122");
    await selectCustomDropdown("indent_type", "Production Order");

    await selectCustomDropdown("item_group_type", itemGroupResolved);

    await selectCustomDropdown("template_name", "Purchase Order");

    console.log("📦 Header setup complete. Opening detail modal...");

    const addButton =
        document.querySelector("#detail_collapsible_panel_open_popup_po_dt");

    if (!addButton) throw new Error("❌ Add New button not found");

    addButton.scrollIntoView({ behavior: "instant", block: "center" });
    await wait(300);

    addButton.click();

    await waitUntil(() => document.querySelector(".modal-content"));

    console.log("✅ PO Detail Modal Opened Successfully");

})();
