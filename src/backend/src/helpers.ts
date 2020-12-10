import { config } from "./pkg-config";

export const removeCommandPrefix = (text: string) => text.charAt(0) === config.commands.prefix ? text.slice(1) : text;
export const addCommandPrefix = (text: string) => config.commands.prefix + text;