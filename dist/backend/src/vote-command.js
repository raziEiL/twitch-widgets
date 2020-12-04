"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VotingPoll = exports.VOTE_COMMAND = void 0;
exports.VOTE_COMMAND = "!vote";
const MESSAGE_VOTE_START = `Голосование началось! Для завершения напишите ${exports.VOTE_COMMAND}`;
const CANDIDATE_REGEX = /\w+/;
class VotingPoll {
    constructor(args) {
        this.command = {
            condidateA: "!" + args[0],
            condidateB: "!" + args[1]
        };
        this.votes = new Map();
    }
    static isInvalidCondidates(args) {
        if (!args.length || args.length !== 2)
            return `для начала голосования напишите ${exports.VOTE_COMMAND} {УЧАСТНИК#1} {УЧАСТНИК#2}. Например: ${exports.VOTE_COMMAND} Fnatic NaVi`;
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
    removePrefix(text) {
        return text.slice(1);
    }
    vote(user, candidate) {
        if (candidate !== this.command.condidateA && candidate !== this.command.condidateB) {
            console.log(`${user} not allowed to vote for unknown candidate ${candidate}`);
            return;
        }
        else if (this.votes.has(user)) {
            console.log(`${user} has already voted!`);
            return;
        }
        this.votes.set(process.env.DEV ? Date.now().toString() : user, candidate);
        console.log(`${user} voted for ${candidate}!`);
    }
    getVoteCount() {
        let voteCountA = 0, voteCountB = 0;
        for (const [, condidate] of this.votes) {
            if (this.command.condidateA === condidate)
                voteCountA++;
            else
                voteCountB++;
        }
        return { voteCountA, voteCountB };
    }
    getVoteData() {
        const votes = this.getVoteCount();
        return {
            condidateA: {
                name: this.removePrefix(this.command.condidateA),
                command: this.command.condidateA,
                votes: votes.voteCountA
            },
            condidateB: {
                name: this.removePrefix(this.command.condidateB),
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
            return "Итоги голосования: победил " + this.removePrefix(this.command.condidateA);
        return "Итоги голосования: победил " + this.removePrefix(this.command.condidateB);
    }
    getVoteStartMessage() {
        return MESSAGE_VOTE_START;
    }
    getHtmlVotelistPage() {
        let body = "";
        for (const [user, command] of this.votes) {
            body += `<tr><td class="tg-0lax">${user}</td><td class="tg-0lax">${this.removePrefix(command)}</td></tr>`;
        }
        return `<style type="text/css">.tg{border-collapse:collapse;border-spacing:0;margin:0px auto}.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial,sans-serif;font-size:14px;overflow:hidden;padding:10px 5px;word-break:normal}.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial,sans-serif;font-size:14px;font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal}.tg .tg-0lax{text-align:left;vertical-align:top}</style><table class="tg"><thead><tr><th class="tg-0lax">User</th><th class="tg-0lax">Candidate</th></tr></thead><tbody>${body}</tbody></table>`;
    }
}
exports.VotingPoll = VotingPoll;
