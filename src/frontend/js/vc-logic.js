// Sotrable
const { Sortable } = require("@shopify/draggable");

const sortable = new Sortable(document.querySelectorAll(".container"), {
    draggable: ".cam",
    delay: { mouse: 150 }
});

sortable.on("sortable:sort", () => console.log("sortable:sort"));
sortable.on("sortable:start", () => console.log("sortable:sort"));
sortable.on("drag:pressure", () => console.log("drag:pressure"));
sortable.on("drag:over", () => console.log("drag:over"));
sortable.on("drag:start", (e) => {

    console.log("drag:start", e.source);
});

// Remove demo window
setTimeout(() => {
    const demo = document.querySelector(".demo");
    if (demo) {
        demo.remove();
        console.log("remove");
    }
}, 6000);

// Debug Logic
const vcMenu = require("./incude/vc-menu");
const { getRandomArbitrary } = require("@raz1el/util");

const container = document.querySelector(".container");
const a = document.querySelector(".button-a");
const b = document.querySelector(".button-b");
let count = 0;

a.addEventListener("click", () => {
    create("a");
});

b.addEventListener("click", () => {
    create("b");
});

/*  unused css ignore fix
createElement("a"); createElement("b"); 
*/

function create(className) {
    if (count >= 10) {
        window.alert("Достигнут лимит камер 10/10");
        return;
    }
    count++;

    const div = document.createElement("div");
    div.classList.add("cam", className, "border-a");
    div.innerHTML = "Удерживайте левую кнопку мыши, чтобы переместить окно<br><br>Нажмите правую кнопку мыши, чтобы открыть меню команд";
    div.style.backgroundColor = `rgb(${getRandomArbitrary(0, 255)},${getRandomArbitrary(0, 255)},${getRandomArbitrary(0, 255)})`;
    vcMenu(div);

    const btn = document.createElement("div");
    btn.classList.add("close");
    btn.textContent = "Наведите курсор, чтобы закрыть";
    addCloseListener(btn);

    const span = document.createElement("span");
    span.classList.add("nickname");
    span.setAttribute("role", "textbox");
    span.setAttribute("contenteditable", "true");
    span.textContent = "Введите ник";

    div.append(span);
    div.append(btn);
    container.append(div);
}

function addCloseListener(element) {
    element.addEventListener("click", () => {
        console.log("click");
        // remove(element);
    });
    element.addEventListener("mouseover", () => {
        console.log("mouseover");
        element.timeout = setTimeout(() => {
            remove(element);
        }, 1000);
    });
    element.addEventListener("mouseout", () => {
        console.log("mouseout");
        if (element.timeout)
            clearTimeout(element.timeout);
    });
}

function remove(element) {
    count--;
    element.parentElement.remove();
}

document.querySelectorAll(".close").forEach(addCloseListener);
document.querySelectorAll(".cam").forEach(vcMenu);