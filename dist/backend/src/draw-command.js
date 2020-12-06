"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_raz_util_1 = require("ts-raz-util");
const helpers_1 = require("./helpers");
const config_json_1 = __importDefault(require("../config.json"));
const COMMAND_DRAW = config_json_1.default.prefix + config_json_1.default.commands.draw.name;
const COMMAND_START = config_json_1.default.prefix + config_json_1.default.commands.drawstart.name;
const COMMAND_STOP = config_json_1.default.prefix + config_json_1.default.commands.drawstop.name;
const MESSAGE_DRAW = `Для настройки розыгрыша напишите ${COMMAND_DRAW} {ВРЕМЯ_В_МИНУТАХ} {ТЕКСТ}. Например: ${COMMAND_DRAW} 5 "УЧАСТВУЙТЕ В РОЗЫГРЫШЕ КРЕДИТОВ!"`;
const MESSAGE_STARTED = `Розыгрыш начался! Принимайте участие с помощью команды ${COMMAND_DRAW} в чат`;
const MESSAGE_START = `Для запуска розыгрыша напишите ${COMMAND_START}, а для отмены ${COMMAND_STOP}`;
class Draw {
    constructor(args) {
        this.countdownSeconds = Number.parseInt(args[0]) * 60;
        this.text = args[1];
        this.users = new Set();
        this.endTimestamp = 0;
        this.lastWinner = "";
    }
    static isInvalidParams(args) {
        if (!args.length || args.length !== 2)
            return MESSAGE_DRAW;
        const num = Number.parseInt(args[0]);
        if (Number.isNaN(num) || num < 1)
            return MESSAGE_DRAW;
    }
    add(user) {
        if (!this.endTimestamp || this.isEnded()) {
            console.log(`${user} cannot vote now!`);
            return;
        }
        this.users.add(user);
        return this;
    }
    start() {
        if (this.endTimestamp)
            return;
        this.endTimestamp = ts_raz_util_1.timestamp() + this.countdownSeconds;
    }
    isEnded() {
        return ts_raz_util_1.timestamp() > this.endTimestamp;
    }
    getRandomWinner() {
        if (this.users.size > 0) {
            const array = [...this.users];
            this.lastWinner = array[helpers_1.getRandomInt(0, array.length)];
            return this.lastWinner;
        }
    }
    getData() {
        return {
            countdownSeconds: this.countdownSeconds,
            text: this.text,
            userCount: this.users.size,
            command: COMMAND_DRAW,
            endTimestamp: this.endTimestamp,
            lastWinner: this.lastWinner
        };
    }
    getStartedMessage() {
        return MESSAGE_STARTED;
    }
    getStartMessage() {
        return MESSAGE_START;
    }
}
exports.default = Draw;
