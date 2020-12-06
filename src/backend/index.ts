import express from "express";
import { StaticAuthProvider } from "twitch-auth";
import { ChatClient } from "twitch-chat-client";
import { REGEX_COMMAND_LINE, REGEX_QUOTES } from "ts-raz-util";
import VotePoll from "./src/vote-command";
import Draw from "./src/draw-command";
import { removePrefix } from "./src/helpers";
import config from "./config.json";

if (!process.env.CLIENT_ID || !process.env.ACCESS_TOKEN || !process.env.CHANNEL_NAME)
    throw new Error("Failed to get variables from .env file!");

const app = express();
const PATH = __dirname.replace("backend", "frontend");
let vote: VotePoll | undefined;
let voteList: string | undefined;
let draw: Draw | undefined;

app.use(express.static("dist/frontend"));

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

const authProvider = new StaticAuthProvider(process.env.CLIENT_ID, process.env.ACCESS_TOKEN);
const chatClient = new ChatClient(authProvider, { channels: [process.env.CHANNEL_NAME], logger: { name: "ChatClient > ", minLevel: 2 } });

chatClient.connect()
    .then(() => {
        console.log("Connected OK");
        /* chatCl.onWhisper((user, message, msg) => {
            onTwitchMessage(msg.target.value, user, message.trim());
        }); */
        chatClient.onMessage(onMessage);
    })
    .catch(() => {
        console.error("Failed to connect");
    });

const MESSAGE_MAX_CHARS = 96;

function onMessage(channel: string, user: string, message: string) {
    if (!message.startsWith(config.prefix) || message.length > MESSAGE_MAX_CHARS)
        return;

    // TODO: проверить админ права пользователя
    let args = removePrefix(message.trim()).match(REGEX_COMMAND_LINE);
    if (!args)
        return;

    args = args.map(s => s.replace(REGEX_QUOTES, ""));
    const command = args.shift();

    if (!command)
        return;

    console.log(`user: ${user}, command: ${command}, args:`, args);

    switch (command) {
        case config.commands.vote.name: {
            if (vote) {
                console.log("The vote has ended");
                chatClient.say(channel, "/me " + vote.getWinnerMessage());
                voteList = vote.getHtmlVotelistPage();
                vote = undefined;
                return;
            }
            const errorMessage = VotePoll.isInvalidParams(args);

            if (errorMessage)
                chatClient.say(channel, `@${user} ` + errorMessage);
            else {
                vote = new VotePoll(args);
                chatClient.say(channel, `@${user} ` + vote.getStartMessage());
                console.log(`Voting progress bar is available at: http://localhost:${process.env.PORT}/vote`);
            }
            break;
        }
        case config.commands.draw.name: {
            if (draw) {
                draw.add(user);
                return;
            }
            const errorMessage = Draw.isInvalidParams(args);

            if (errorMessage)
                chatClient.say(channel, `@${user} ` + errorMessage);
            else {
                draw = new Draw(args);
                chatClient.say(channel, `@${user} ` + draw.getStartMessage());
                console.log(`Prize drawing status is available at: http://localhost:${process.env.PORT}/draw`);
            }
            break;
        }
        case config.commands.drawstart.name: {
            if (draw) {
                console.log("The draw has started!");
                draw.start();
                chatClient.say(channel, "/me " + draw.getStartedMessage());
                return;
            }
            break;
        }
        case config.commands.drawstop.name: {
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