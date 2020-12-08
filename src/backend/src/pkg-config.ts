import path from "path";
import fs from "fs";
import { Config } from "./types";

// Read external config file (Reqired for pkg build)
export const isPkg = __dirname.includes("snapshot");
// path.join нормализует сигменты "." и ".." тем самым путь "c:\twitch\..\config.json" преобразуется в "c:\config.json"
export const configFilename = path.join(isPkg ? path.dirname(process.execPath) : (__dirname + "/../../../"), "config.json");

if (!fs.existsSync(configFilename)) {
    const message = `Configuration file not found in ${configFilename}`;
    console.error(message);
    sleepSync(3000);
    throw new Error(message);
}

export const config = JSON.parse(fs.readFileSync(configFilename, { encoding: "utf8" })) as Config;

function sleepSync(milliseconds: number) {
    const date = Date.now();
    let currentDate;
    do {
        currentDate = Date.now() - date;
    } while (currentDate < milliseconds);
}
