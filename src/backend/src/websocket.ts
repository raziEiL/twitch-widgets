// Use the websocket-relay to serve a raw MPEG-TS over WebSockets. You can use
// ffmpeg to feed the relay. ffmpeg -> websocket-relay -> browser
import fs from "fs";
import WebSocket from "ws";
import { Request, Response } from "express";
import { Socket } from "net";
import { config } from "./pkg-config";
import { log, logError } from "./helpers";

interface ServerExtend extends WebSocket.Server {
    connectionCount: number;
    broadcast(data: any): void;
}

export interface RequestExtend extends Request {
    socket: SocketExtend;
}

interface SocketExtend extends Socket {
    recording: fs.WriteStream | undefined;
}

const clientAddress = new Set<string>(), socketPort = new Set<number>();
let socketNextPort = 8081;

export function getPorts() {
    return { ports: [...socketPort] };
}

function createSocket(address: string) {
    if (!config.websocket.allowMultistream && clientAddress.has(address)) {
        log(`Multiple Streams not allowed (address: ${address})`);
        return;
    }

    const port = socketNextPort++;
    clientAddress.add(address);
    socketPort.add(port);
    log("Create WebSocket and awaiting connections on ws://127.0.0.1:" + port + "/");

    const webSocket = new WebSocket.Server({ port, perMessageDeflate: false, noServer: true }) as ServerExtend;
    webSocket.connectionCount = 0;

    webSocket.on("connection", (socket, upgradeReq) => {
        webSocket.connectionCount++;
        log("New WebSocket Client Connection: " + upgradeReq.socket.remoteAddress + upgradeReq.socket.remotePort + ` (${webSocket.connectionCount} total)`);

        socket.on("close", () => {
            webSocket.connectionCount--;
            log("Client Disconnected WebSocket: " + upgradeReq.socket.remoteAddress + upgradeReq.socket.remotePort + ` (${webSocket.connectionCount} total)`);
        });
    });

    webSocket.on("close", () => {
        socketPort.delete(port);
        clientAddress.delete(address);
        log(`Close WebSocket (port: ${port})`);
    });

    webSocket.on("error", (error) => {
        logError(error.message);
    });

    webSocket.broadcast = (data: any) => {
        for (const client of webSocket.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        }
    };
    return webSocket;
}

// HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
export function processMpegTs(req: RequestExtend, res: Response) {
    if (req.headers.authorization !== config.websocket.secret) {
        log("Failed Stream Connection: " + req.socket.remoteAddress + ":" + req.socket.remotePort + " - wrong secret.");
        res.end();
        return;
    }

    log("Stream Connected: " + req.socket.remoteAddress + ":" + req.socket.remotePort);

    if (res.socket)
        res.socket.setTimeout(0);

    if (!req.socket.remoteAddress) {
        res.end();
        return;
    }

    const socketServer = createSocket(req.socket.remoteAddress);

    if (!socketServer) {
        res.end();
        return;
    }

    req.on("data", (data) => {
        socketServer.broadcast(data);

        if (req.socket.recording)
            req.socket.recording.write(data);
    });

    req.on("close", () => {
        log("Stream Disconnected: " + req.socket.remoteAddress + ":" + req.socket.remotePort);
        socketServer.close();

        if (req.socket.recording)
            req.socket.recording.close();
    });

    // Record the stream to a local file?
    if (config.websocket.recordStream)
        req.socket.recording = fs.createWriteStream("recordings/" + Date.now() + ".ts");
}
