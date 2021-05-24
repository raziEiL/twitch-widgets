
const JSMpeg = require("./incude/jsmpeg-player.umd.min");
const bf = require("../../../dist/backend/src/buffer-helpers");
const jsMpegs = new Map();

const isLocalehost = () => document.location.hostname.includes("localhost") && document.location.hostname.length === 9;
const container = document.querySelector(".container");
createSocket();

function createSocket() {
    const socket = new WebSocket((isLocalehost() ? "ws://" : "wss://") + document.location.hostname);
    socket.binaryType = "arraybuffer";

    socket.addEventListener("open", () => {
        console.log("socket open");
        /*     for (const [jsMpeg] of jsMpegs.entries()) {
                jsMpeg.player.source.onOpen();
            } */
    });

    //socket.addEventListener("error", onClosed);
    socket.addEventListener("close", onClosed);

    function onClosed() {
        for (const [jsMpeg] of jsMpegs.entries()) {
            try {
                jsMpeg.stop();
                jsMpeg.destroy();
            } catch { }
        }
        jsMpegs.clear();
        const divs = document.querySelectorAll("div");

        for (const div of divs)
            div.remove();

        console.log("socket closed");
        setTimeout(createSocket, 5000);
    }

    socket.addEventListener("message", (ev) => {
        if (!ev.data) return;

        const obj = bf.unpackBuffer(ev.data);

        switch (obj.packType) {
            case bf.PackType.Mpegts: {
                // create player
                if (!jsMpegs.has(obj.data)) {
                    const div = document.createElement("div");
                    div.dataset.index = obj.data;
                    div.classList.add("cam");
                    container.append(div);

                    const jsMpeg = new JSMpeg.VideoElement(div, (isLocalehost() ? "ws://" : "wss://") + document.location.hostname, {
                        control: false,
                        autoplay: true,
                    });

                    jsMpegs.set(obj.data, jsMpeg);

                    if (obj.concatBuffer)
                        jsMpeg.player.source.onMessage(obj.concatBuffer);

                    console.log("Create JsMpeg player index =", obj.data);
                }
                else {
                    const jsMpeg = jsMpegs.get(obj.data);

                    if (jsMpeg)
                        jsMpeg.player.source.onMessage(obj.concatBuffer);
                }
                break;
            }
            case bf.PackType.Event: {
                if (obj.type == bf.EventType.Close) {
                    const jsMpeg = jsMpegs.get(obj.data);
                    jsMpegs.delete(obj.data);

                    try {
                        jsMpeg.stop();
                        jsMpeg.destroy();
                    } catch { }

                    const divs = document.querySelectorAll("div");

                    for (const div of divs) {
                        if (div.dataset.index == obj.data) {
                            div.remove();
                            console.log("Destroy JsMpeg player index =", obj.data);
                            break;
                        }
                    }
                }
                break;
            }
        }
    });
}