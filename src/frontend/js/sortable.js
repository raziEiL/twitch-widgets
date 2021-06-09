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