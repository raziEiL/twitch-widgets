
import { VoteCandidates, VoteCount, VoteCandidatesData } from "./types";
import { removePrefix, addPrefix } from "./helpers";
import config from "../config.json";

const COMMAND = config.prefix + config.commands.vote.name;
const MESSAGE_START = `Голосование началось! Для завершения напишите ${COMMAND}`;
const CANDIDATE_REGEX = /\w+/;

export default class VotePoll {
    command: VoteCandidates;
    votes: Map<string, string>;

    static isInvalidParams(args: string[]) {
        if (!args.length || args.length !== 2)
            return `для начала голосования напишите ${COMMAND} {УЧАСТНИК#1} {УЧАСТНИК#2}. Например: ${COMMAND} Fnatic NaVi`;
        else {
            const unqie = new Set<string>();
            for (const arg of args) {
                if (!CANDIDATE_REGEX.test(arg))
                    return "имена участников голосования должны состоять из букв латинского алфавита или цыфр";
                unqie.add(arg);
            }
            if (unqie.size !== 2)
                return "имена участников не должны совпадать";
        }
    }
    constructor(args: string[]) {
        this.command = {
            condidateA: addPrefix(args[0]),
            condidateB: addPrefix(args[1])
        };
        this.votes = new Map<string, string>();
    }
    vote(user: string, candidate: string) {
        if (candidate !== this.command.condidateA && candidate !== this.command.condidateB) {
            console.log(`${user} not allowed to vote for unknown candidate ${candidate}`);
            return;
        }
        else if (this.votes.has(user)) {
            console.log(`${user} has already voted!`);
            //  this.chatClient.say(this.channel, `@${user} вы уже проголосовали!`);
            return;
        }
        this.votes.set(process.env.DEV ? Date.now().toString() : user, candidate);
        console.log(`${user} voted for ${candidate}!`);
        return this;
    }
    getVoteCount(): VoteCount {
        let voteCountA = 0, voteCountB = 0;

        for (const [, condidate] of this.votes) {
            if (this.command.condidateA === condidate)
                voteCountA++;
            else
                voteCountB++;
        }
        return { voteCountA, voteCountB };
    }
    getData(): VoteCandidatesData {
        const votes = this.getVoteCount();
        return {
            condidateA: {
                name: removePrefix(this.command.condidateA),
                command: this.command.condidateA,
                votes: votes.voteCountA
            },
            condidateB: {
                name: removePrefix(this.command.condidateB),
                command: this.command.condidateB,
                votes: votes.voteCountB
            }
        };
    }
    getWinnerMessage() {
        const votes = this.getVoteCount();
        if (votes.voteCountA === votes.voteCountB)
            return "Итоги голосования: ничья!";
        else if (votes.voteCountA > votes.voteCountB)
            return "Итоги голосования: победил " + removePrefix(this.command.condidateA);
        return "Итоги голосования: победил " + removePrefix(this.command.condidateB);
    }
    getStartMessage() {
        return MESSAGE_START;
    }
    getHtmlVotelistPage() {
        let body = "";
        for (const [user, command] of this.votes) {
            body += `<tr><td class="tg-0lax">${user}</td><td class="tg-0lax">${removePrefix(command)}</td></tr>`;
        }
        return `<style type="text/css">.tg{border-collapse:collapse;border-spacing:0;margin:0px auto}.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial,sans-serif;font-size:14px;overflow:hidden;padding:10px 5px;word-break:normal}.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial,sans-serif;font-size:14px;font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal}.tg .tg-0lax{text-align:left;vertical-align:top}</style><table class="tg"><thead><tr><th class="tg-0lax">User</th><th class="tg-0lax">Candidate</th></tr></thead><tbody>${body}</tbody></table>`;
    }
} 