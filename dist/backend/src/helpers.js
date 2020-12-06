"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomInt = exports.addPrefix = exports.removePrefix = void 0;
const config_json_1 = __importDefault(require("../config.json"));
const removePrefix = (text) => text.charAt(0) === config_json_1.default.prefix ? text.slice(1) : text;
exports.removePrefix = removePrefix;
const addPrefix = (text) => config_json_1.default.prefix + text;
exports.addPrefix = addPrefix;
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
exports.getRandomInt = getRandomInt;
