document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent default form submit if any
        
        const btn = document.getElementById("imgBtnRunSearch");
        if (btn) {
            btn.click();
        }
    }
});
