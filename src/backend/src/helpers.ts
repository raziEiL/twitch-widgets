
import config from "../config.json";

export const removePrefix = (text: string) => text.charAt(0) === config.prefix ? text.slice(1) : text;
export const addPrefix = (text: string) => config.prefix + text;
export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}
