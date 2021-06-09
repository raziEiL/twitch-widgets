// Context menu
const menu = document.querySelector(".menu");
const opt0 = document.querySelector(".menu--opt-0");
const opt1 = document.querySelector(".menu--opt-1");

opt0.addEventListener("click", () => {
    console.log("click opt-0");
    if (opt0.menuParent) {
        opt0.menuParent.classList.add("border-a");
        opt0.menuParent.classList.remove("border-b");
    }
});

opt1.addEventListener("click", () => {
    console.log("click opt-1");
    if (opt1.menuParent) {
        opt1.menuParent.classList.add("border-b");
        opt1.menuParent.classList.remove("border-a");
    }
});

//exit the context menu
window.addEventListener("click", () => {
    if (menu.style.display === "block") {
        menu.style.display = "none";
        console.log("menu hide");
    }
});

module.exports = function addMenuListener(element) {
    element.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        console.log("menu show");
        // Show the context menu
        menu.style.display = "block";

        // set position X of the menu
        if ((window.innerWidth - e.clientX) > menu.offsetWidth + 10) {
            menu.style.left = e.clientX + "px";
        }
        else {
            menu.style.left = (e.clientX - menu.offsetWidth) + "px";
        }
        // set position Y of the menu
        if ((window.innerHeight - e.clientY) > menu.offsetHeight + 10) {
            menu.style.top = e.clientY + "px";
        }
        else {
            menu.style.top = (e.clientY - menu.offsetHeight) + "px";
        }
        opt0.menuParent = element;
        opt1.menuParent = element;
    });
}
