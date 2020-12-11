export interface VoteCandidates {
    condidateA: string;
    condidateB: string;
}

export interface VoteCount {
    voteCountA: number;
    voteCountB: number;
}

export interface VoteCandidatesData {
    condidateA: VoteData;
    condidateB: VoteData;
}

export interface VoteData {
    command: string;
    votes: number;
}

export interface DrawData {
    countdownSeconds: number;
    text: string;
    userCount: number;
    command: string;
    endTimestamp: number;
    lastWinner: string;
}

// Config
export interface Config {
    debug: Debug;
    twitch: Twitch;
    commands: Commands;
}

export interface Debug {
    twitch: boolean;
    fakeUsers: boolean;
}

export interface Commands {
    prefix: string;
    notify: boolean;
    vote: Command;
    draw: Command;
    drawstop: Command;
    drawstart: Command;
}

export interface Command {
    name: string;
    admin: boolean;
}

export interface Twitch {
    password: string;
    login: string;
    httpPort: number;
    ircPort: number;
}