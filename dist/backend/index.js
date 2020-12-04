"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const twitch_auth_1 = require("twitch-auth");
const twitch_chat_client_1 = require("twitch-chat-client");
const Vote = __importStar(require("./src/vote-command"));
if (!process.env.CLIENT_ID || !process.env.ACCESS_TOKEN || !process.env.CHANNEL_NAME)
    throw new Error("Failed to get variables from .env file!");
const app = express_1.default();
const HTML_PATH = __dirname.replace("backend", "frontend") + "/index.html";
let voting;
let voteList;
app.use(express_1.default.static("dist/frontend"));
app.get("/", (req, res) => {
    res.sendFile(HTML_PATH);
});
app.get("/api/voting", (req, res) => {
    if (voting)
        res.json(voting.getVoteData());
    else
        res.status(503).send("The voting is not started yet!");
});
app.get("/votelist", (req, res) => {
    if (voting)
        res.send(voting.getHtmlVotelistPage());
    else if (voteList)
        res.send(voteList);
    else
        res.status(503).send("The voting is not started yet!");
});
app.listen(process.env.PORT, () => {
    console.log(`express listening at port ${process.env.PORT}`);
});
const authProvider = new twitch_auth_1.StaticAuthProvider(process.env.CLIENT_ID, process.env.ACCESS_TOKEN);
const chatClient = new twitch_chat_client_1.ChatClient(authProvider, { channels: [process.env.CHANNEL_NAME], logger: { name: "ChatClient > ", minLevel: 2 } });
chatClient.connect()
    .then(() => {
    console.log("Connected OK");
    chatClient.onMessage(onMessage);
})
    .catch(() => {
    console.error("Failed to connect");
});
function onMessage(channel, user, message) {
    if (!message.startsWith("!"))
        return;
    const args = message.trim().split(" ");
    const command = args.shift();
    switch (command) {
        case Vote.VOTE_COMMAND: {
            if (voting) {
                console.log("The vote has ended");
                chatClient.say(channel, "/me " + voting.getWinnerMessage());
                voteList = voting.getHtmlVotelistPage();
                voting = undefined;
                return;
            }
            const errorMessage = Vote.VotingPoll.isInvalidCondidates(args);
            if (errorMessage)
                chatClient.say(channel, `@${user} ` + errorMessage);
            else {
                voting = new Vote.VotingPoll(args);
                chatClient.say(channel, `@${user} ` + voting.getVoteStartMessage());
                console.log(`Voting progress bar is available at: http://localhost:${process.env.PORT}`);
            }
            break;
        }
        default: {
            if (voting) {
                switch (command) {
                    case voting.command.condidateA: {
                        voting.vote(user, voting.command.condidateA);
                        break;
                    }
                    case voting.command.condidateB: {
                        voting.vote(user, voting.command.condidateB);
                        break;
                    }
                    default: {
                        console.log(`Command ${command} not found`);
                    }
                }
            }
            else
                console.log(`Command ${command} not found`);
        }
    }
}
