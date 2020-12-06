"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const twitch_auth_1 = require("twitch-auth");
const twitch_chat_client_1 = require("twitch-chat-client");
const ts_raz_util_1 = require("ts-raz-util");
const vote_command_1 = __importDefault(require("./src/vote-command"));
const draw_command_1 = __importDefault(require("./src/draw-command"));
const helpers_1 = require("./src/helpers");
const config_json_1 = __importDefault(require("./config.json"));
if (!process.env.CLIENT_ID || !process.env.ACCESS_TOKEN || !process.env.CHANNEL_NAME)
    throw new Error("Failed to get variables from .env file!");
const app = express_1.default();
const PATH = __dirname.replace("backend", "frontend");
let vote;
let voteList;
let draw;
app.use(express_1.default.static("dist/frontend"));
app.get("/vote", (req, res) => {
    res.sendFile(PATH + "/vote.html");
});
app.get("/vote/list", (req, res) => {
    if (vote)
        res.send(vote.getHtmlVotelistPage());
    else if (voteList)
        res.send(voteList);
    else
        res.status(503).send("The voting is not started yet!");
});
app.get("/draw", (req, res) => {
    res.sendFile(PATH + "/draw.html");
});
app.get("/api/vote", (req, res) => {
    if (vote)
        res.json(vote.getData());
    else
        res.status(503).send("The voting is not started yet!");
});
app.get("/api/draw", (req, res) => {
    if (draw)
        res.json(draw.getData());
    else
        res.status(503).send("The prize drawing is not started yet!");
});
app.get("/api/draw/winner", (req, res) => {
    if (draw)
        res.send(draw.getRandomWinner());
    else
        res.status(503).send("The prize drawing is not started yet!");
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
const MESSAGE_MAX_CHARS = 96;
function onMessage(channel, user, message) {
    if (!message.startsWith(config_json_1.default.prefix) || message.length > MESSAGE_MAX_CHARS)
        return;
    let args = helpers_1.removePrefix(message.trim()).match(ts_raz_util_1.REGEX_COMMAND_LINE);
    if (!args)
        return;
    args = args.map(s => s.replace(ts_raz_util_1.REGEX_QUOTES, ""));
    const command = args.shift();
    if (!command)
        return;
    console.log(`user: ${user}, command: ${command}, args:`, args);
    switch (command) {
        case config_json_1.default.commands.vote.name: {
            if (vote) {
                console.log("The vote has ended");
                chatClient.say(channel, "/me " + vote.getWinnerMessage());
                voteList = vote.getHtmlVotelistPage();
                vote = undefined;
                return;
            }
            const errorMessage = vote_command_1.default.isInvalidParams(args);
            if (errorMessage)
                chatClient.say(channel, `@${user} ` + errorMessage);
            else {
                vote = new vote_command_1.default(args);
                chatClient.say(channel, `@${user} ` + vote.getStartMessage());
                console.log(`Voting progress bar is available at: http://localhost:${process.env.PORT}/vote`);
            }
            break;
        }
        case config_json_1.default.commands.draw.name: {
            if (draw) {
                draw.add(user);
                return;
            }
            const errorMessage = draw_command_1.default.isInvalidParams(args);
            if (errorMessage)
                chatClient.say(channel, `@${user} ` + errorMessage);
            else {
                draw = new draw_command_1.default(args);
                chatClient.say(channel, `@${user} ` + draw.getStartMessage());
                console.log(`Prize drawing status is available at: http://localhost:${process.env.PORT}/draw`);
            }
            break;
        }
        case config_json_1.default.commands.drawstart.name: {
            if (draw) {
                console.log("The draw has started!");
                draw.start();
                chatClient.say(channel, "/me " + draw.getStartedMessage());
                return;
            }
            break;
        }
        case config_json_1.default.commands.drawstop.name: {
            if (draw) {
                console.log("The draw has stopped!");
                draw = undefined;
                return;
            }
            break;
        }
        default: {
            if (vote) {
                switch (command) {
                    case vote.command.condidateA: {
                        vote.vote(user, vote.command.condidateA);
                        break;
                    }
                    case vote.command.condidateB: {
                        vote.vote(user, vote.command.condidateB);
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
