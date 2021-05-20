const request = require("./incude/request");
const JSMpeg = require("./incude/jsmpeg-player.umd.min.js");
const ports = new Map();

setInterval(() => {
    request("/stream/list", streamCallback);
}, 1000);

function streamCallback(httpRequest) {
    if (httpRequest.readyState != 4) return;

    if (httpRequest.status == 200) {
        const data = JSON.parse(httpRequest.responseText);
        /*  console.log(data); */

        const container = document.querySelector(".container");

        // create player
        for (const port of data.ports) {
            if (ports.has(port)) continue;

            const div = document.createElement("div");
            div.dataset.port = port;
            div.classList.add("cam");
            container.append(div);

            const jsMpeg = new JSMpeg.VideoElement(div, "ws://" + document.location.hostname + `:${port}/`, {
                control: false,
                autoplay: true,
            });
            ports.set(port, jsMpeg);
            console.log("Create JsMpeg player port =", port);
        }

        // destroy player
        const keys = ports.keys();

        for (const key of keys) {
            if (!data.ports.includes(key)) {
                try {
                    ports.get(key).stop();
                } catch { }
                const divs = document.querySelectorAll("div");

                for (const div of divs) {
                    if (div.dataset.port == key) {
                        div.remove();
                        console.log("Destroy JsMpeg player port =", key);
                        break;
                    }
                }
            }
        }
    }
    else {
        console.log("С запросом возникла проблема. status: " + httpRequest.status);
    }
}