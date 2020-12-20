require("./incude/obs");
const cookie = require("js-cookie");
const buildThemePath = (theme) => `css/theme-${theme}.min.css`;
const link = getThemeLink();
loadTheme();

// Load stored theme
function loadTheme() {
    const theme = cookie.get("theme");

    if (theme)
        changeTheme(theme);
    else
        console.log("Cookie theme not found. Use deafult theme.");

    // index.html
    const select = document.querySelector("#theme");

    if (!select)
        return;

    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.includes(theme)) {
            select.selectedIndex = i;
            break;
        }
    }
    select.addEventListener("change", (event) => {
        if (!event.target)
            return;

        const themeName = event.target.options[event.target.selectedIndex].value;
        changeTheme(themeName);
    });
}

function getThemeLink() {
    const links = document.querySelectorAll("link");
    for (const link of links) {
        if (link.href.includes("theme-"))
            return link;
    }

    const newlink = document.createElement("link");
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "text/css");
    newlink.setAttribute("href", buildThemePath("default"));
    document.head.append(newlink);
    return newlink;
}

function changeTheme(theme) {
    if (!link) {
        console.error("Can't change the theme due link element not found!");
        return;
    }
    link.href = buildThemePath(theme);
    cookie.set("theme", theme);
    console.log("update theme to " + theme);
}