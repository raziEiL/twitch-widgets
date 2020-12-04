import express from "express";
import { StaticAuthProvider } from "twitch-auth";
import { ChatClient } from "twitch-chat-client";
import * as Vote from "./src/vote-command";

if (!process.env.CLIENT_ID || !process.env.ACCESS_TOKEN || !process.env.CHANNEL_NAME)
    throw new Error("Failed to get variables from .env file!");

const app = express();
const HTML_PATH = __dirname.replace("backend", "frontend") + "/index.html";
let voting: Vote.VotingPoll | undefined;
let voteList: string | undefined;

app.use(express.static("dist/frontend"));

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

function onMessage(channel: string, user: string, message: string) {
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