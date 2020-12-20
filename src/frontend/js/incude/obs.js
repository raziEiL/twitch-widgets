// fix styles 
setTimeout(() => {
    document.querySelector("body").classList.remove("hidden");
}, 200);

// go back feature
if (window.location.pathname !== "/") {
    const body = document.querySelector("body");
    body.addEventListener("dblclick", () => {
        /*  window.history.back(); */
        document.location.replace("http://localhost");
    });
}