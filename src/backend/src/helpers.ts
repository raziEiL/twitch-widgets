import fs from "fs";
import path from "path";
import { config } from "./pkg-config";

export const removeCommandPrefix = (text: string) => text.charAt(0) === config.commands.prefix ? text.slice(1) : text;
export const addCommandPrefix = (text: string) => config.commands.prefix + text;

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

export function getFilesListRecursively(dir: string) {
    let results: string[] = [];

    fs.readdirSync(dir).forEach((file) => {
        file = path.join(dir + "/" + file);
        const stat = fs.statSync(file);

        if (stat && stat.isDirectory())
            results = results.concat(getFilesListRecursively(file));
        else
            results.push(file);
    });

    return results;
}