"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const config_json_1 = __importDefault(require("../config.json"));
const COMMAND = config_json_1.default.prefix + config_json_1.default.commands.vote.name;
const MESSAGE_START = `Голосование началось! Для завершения напишите ${COMMAND}`;
const CANDIDATE_REGEX = /\w+/;
class VotePoll {
    constructor(args) {
        this.name = {
            condidateA: args[0],
            condidateB: args[1]
        };
        this.votes = new Map();
    }
    static isInvalidParams(args) {
        if (!args.length || args.length !== 2)
            return `для начала голосования напишите ${COMMAND} {УЧАСТНИК#1} {УЧАСТНИК#2}. Например: ${COMMAND} Fnatic NaVi`;
        else {
            const unqie = new Set();
            for (const arg of args) {
                if (!CANDIDATE_REGEX.test(arg))
                    return "имена участников голосования должны состоять из букв латинского алфавита или цыфр";
                unqie.add(arg);
            }
            if (unqie.size !== 2)
                return "имена участников не должны совпадать";
        }
    }
    vote(user, candidate) {
        if (candidate !== this.name.condidateA && candidate !== this.name.condidateB) {
            console.log(`${user} not allowed to vote for unknown candidate ${candidate}`);
            return;
        }
        else if (this.votes.has(user)) {
            console.log(`${user} has already voted!`);
            return;
        }
        this.votes.set(process.env.DEV ? Date.now().toString() : user, candidate);
        console.log(`${user} voted for ${candidate}!`);
        return this;
    }
    getVoteCount() {
        let voteCountA = 0, voteCountB = 0;
        for (const [, condidate] of this.votes) {
            if (this.name.condidateA === condidate)
                voteCountA++;
            else
                voteCountB++;
        }
        return { voteCountA, voteCountB };
    }
    getData() {
        const votes = this.getVoteCount();
        return {
            condidateA: {
                command: helpers_1.addPrefix(this.name.condidateA),
                votes: votes.voteCountA
            },
            condidateB: {
                command: helpers_1.addPrefix(this.name.condidateB),
                votes: votes.voteCountB
            }
        };
    }
    getWinnerMessage() {
        const votes = this.getVoteCount();
        if (votes.voteCountA === votes.voteCountB)
            return "Итоги голосования: ничья!";
        else if (votes.voteCountA > votes.voteCountB)
            return "Итоги голосования: победил " + this.name.condidateA;
        return "Итоги голосования: победил " + this.name.condidateB;
    }
    getStartMessage() {
        return MESSAGE_START;
    }
    getHtmlVotelistPage() {
        let body = "";
        for (const [user, condidate] of this.votes) {
            body += `<tr><td class="tg-0lax">${user}</td><td class="tg-0lax">${condidate}</td></tr>`;
        }
        return `<style type="text/css">.tg{border-collapse:collapse;border-spacing:0;margin:0px auto}.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial,sans-serif;font-size:14px;overflow:hidden;padding:10px 5px;word-break:normal}.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial,sans-serif;font-size:14px;font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal}.tg .tg-0lax{text-align:left;vertical-align:top}</style><table class="tg"><thead><tr><th class="tg-0lax">User</th><th class="tg-0lax">Candidate</th></tr></thead><tbody>${body}</tbody></table>`;
    }
}
exports.default = VotePoll;
