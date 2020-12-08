import { timestamp } from "ts-raz-util";
import { getRandomInt } from "./helpers";
import { DrawData } from "./types";
import { config } from "./pkg-config";

const COMMAND_DRAW = config.commands.prefix + config.commands.draw.name;
const COMMAND_START = config.commands.prefix + config.commands.drawstart.name;
const COMMAND_STOP = config.commands.prefix + config.commands.drawstop.name;
const MESSAGE_DRAW = `Для настройки розыгрыша напишите ${COMMAND_DRAW} {ВРЕМЯ_В_МИНУТАХ} {ТЕКСТ}. Например: ${COMMAND_DRAW} 5 "УЧАСТВУЙТЕ В РОЗЫГРЫШЕ КРЕДИТОВ!"`;
const MESSAGE_STARTED = `Розыгрыш начался! Принимайте участие с помощью команды ${COMMAND_DRAW} в чат`;
const MESSAGE_START = `Для запуска розыгрыша напишите ${COMMAND_START}, а для отмены ${COMMAND_STOP}`;

export default class Draw {
    private countdownSeconds: number;
    private endTimestamp: number;
    private text: string;
    private users: Set<string>;
    private lastWinner: string;

    static isInvalidParams(args: string[]) {
        if (!args.length || args.length !== 2)
            return MESSAGE_DRAW;

        const num = Number.parseInt(args[0]);

        if (Number.isNaN(num) || num < 1)
            return MESSAGE_DRAW;
    }
    constructor(args: string[]) {
        this.countdownSeconds = Number.parseInt(args[0]) * 60;
        this.text = args[1];
        this.users = new Set<string>();
        this.endTimestamp = 0;
        this.lastWinner = "";
    }
    add(user: string) {
        if (!this.endTimestamp || this.isEnded()) {
            console.log(`${user} cannot vote now!`);
            return;
        }
        if (config.debug.fakeUsers)
            this.users.add(user + Date.now().toString());
        else
            this.users.add(user);
        return this;
    }
    start() {
        if (this.endTimestamp)
            return;
        this.endTimestamp = timestamp() + this.countdownSeconds;
    }
    isEnded() {
        return timestamp() > this.endTimestamp;
    }
    getRandomWinner() {
        if (this.users.size > 0) {
            const array = [...this.users];
            this.lastWinner = array[getRandomInt(0, array.length)];
            return this.lastWinner;
        }
    }
    getData(): DrawData {
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