import path from "path";
import fs from "fs";
import { sleepSync } from "@raz1el/util";
import { Config } from "./types";
import { logError } from "./helpers";

// Read external config file (Reqired for pkg build)
export const isPkg = __dirname.includes("snapshot");
// path.join нормализует сигменты "." и ".." тем самым путь "c:\twitch\..\config.json" преобразуется в "c:\config.json"
export const rootPath = path.normalize(isPkg ? path.dirname(process.execPath) : (__dirname + "/../../../"));
export const configPath = path.join(rootPath, "config.json");

if (!fs.existsSync(configPath)) {
    const message = `Configuration file not found in ${configPath}`;
    logError(message);
    sleepSync(3000);
    throw new Error(message);
}

export const config = JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" })) as Config;