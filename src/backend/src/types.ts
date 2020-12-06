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