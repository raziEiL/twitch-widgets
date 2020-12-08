// TODO: README
// TODO: обновить ts-raz-util
// crash log for debugging pkg app
process.on("uncaughtException", (err) => {
    fs.writeFileSync("crash.log", err.message);
});

import express from "express";
import fs from "fs";
import path from "path";
import tmi from "tmi.js";
import { REGEX_COMMAND_LINE, REGEX_QUOTES } from "ts-raz-util";
import VotePoll from "./src/vote-command";
import Draw from "./src/draw-command";
import { removeCommandPrefix } from "./src/helpers";
import { config } from "./src/pkg-config";

let vote: VotePoll | undefined;
let voteList: string | undefined;
let draw: Draw | undefined;
/*
|==========================================================================
| HTTP SERVER
|==========================================================================
*/
const app = express();
const PATH = path.join(__dirname, "..", "frontend");

app.use(express.static(PATH));

app.get("/vote", (req, res) => {
    res.sendFile(path.join(PATH, "vote.html"));
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
    res.sendFile(path.join(PATH, "draw.html"));
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

app.listen(config.twitch.httpPort, () => {
    console.log(`Http server listening at http://localhost:${config.twitch.httpPort}`);
});
/*
|==========================================================================
| TWITCH BOT
|==========================================================================
*/
const MESSAGE_MAX_CHARS = 96;
const adminCommands: string[] = [];

for (const key in config.commands) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // @ts-ignore
    if (config.commands[key].admin)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        // @ts-ignore
        adminCommands.push(config.commands[key].name);
}

const client = tmi.Client({
    options: { debug: config.debug.twitch },
    connection: {
        reconnect: true,
        secure: true,
        port: config.twitch.ircPort
    },
    identity: {
        username: config.twitch.login,
        password: config.twitch.password
    },
    channels: [config.twitch.login]
});

client.connect()
    .then(() => {
        console.log(`Connected to ${config.twitch.login} Twitch channel`);
    })
    .catch(e => {
        console.error(`Failed to connect to ${config.twitch.login} Twitch channel. Reason:`, e);
    });

client.on("message", (channel, userState, message, self) => {
    const { username } = userState;

    if (self || !username)
        return;

    if (!message.startsWith(config.commands.prefix) || message.length > MESSAGE_MAX_CHARS)
        return;

    let args = removeCommandPrefix(message.trim()).match(REGEX_COMMAND_LINE);
    if (!args)
        return;

    args = args.map(s => s.replace(REGEX_QUOTES, ""));
    const command = args.shift();

    if (!command)
        return;

    const isAdmin = username === config.twitch.login;

    if (!isAdmin && adminCommands.includes(command)) {
        console.log(`user: ${username} has no access to the ${command} command`);
        return;
    }

    console.log(`user: ${username}, command: ${command}, args:`, args);

    switch (command) {
        case config.commands.vote.name: {
            if (vote) {
                console.log("The vote has ended");
                say(channel, "/me " + vote.getWinnerMessage());
                voteList = vote.getHtmlVotelistPage();
                vote = undefined;
                return;
            }
            const errorMessage = VotePoll.isInvalidParams(args);

            if (errorMessage)
                say(channel, `@${username} ` + errorMessage);
            else {
                vote = new VotePoll(args);
                say(channel, `@${username} ` + vote.getStartMessage());
                console.log(`Voting progress bar is available at: http://localhost:${config.twitch.httpPort}/vote`);
            }
            break;
        }
        case config.commands.draw.name: {
            if (draw) {
                draw.add(username);
                return;
            }
            if (!isAdmin)
                return;

            const errorMessage = Draw.isInvalidParams(args);

            if (errorMessage)
                say(channel, `@${username} ` + errorMessage);
            else {
                draw = new Draw(args);
                say(channel, `@${username} ` + draw.getStartMessage());
                console.log(`Prize drawing status is available at: http://localhost:${config.twitch.httpPort}/draw`);
            }
            break;
        }
        case config.commands.drawstart.name: {
            if (draw) {
                console.log("The draw has started!");
                draw.start();
                say(channel, "/me " + draw.getStartedMessage());
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
                    case vote.name.condidateA: {
                        vote.vote(username, vote.name.condidateA);
                        break;
                    }
                    case vote.name.condidateB: {
                        vote.vote(username, vote.name.condidateB);
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
});

function say(channel: string, message: string) {
    client.say(channel, message).catch(console.error);
}