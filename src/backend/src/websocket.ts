// Use the websocket-relay to serve a raw MPEG-TS over WebSockets. You can use
// ffmpeg to feed the relay. ffmpeg -> websocket-relay -> browser
import fs from "fs";
import WebSocket from "ws";
import { Request, Response } from "express";
import { Socket } from "net";
import { Server } from "http";
import { config } from "./pkg-config";
import { log, logError } from "./helpers";
import * as bf from "./buffer-helpers";

export interface ServerExtend extends WebSocket.Server {
    connectionCount: number;
    broadcast(data: Buffer | string): void;
    processMpegTs(req: RequestExtend, res: Response): void;
}

export interface RequestExtend extends Request {
    socket: SocketExtend;
}

export interface SocketExtend extends Socket {
    recording: fs.WriteStream | undefined;
}

const MAX_STREAMS = 9; // incldue 0
const clientAddress = new Set<string>();

export function createSocket(server: Server) {
    const webSocket = new WebSocket.Server({ server }) as ServerExtend;
    webSocket.connectionCount = 0;

    webSocket.on("connection", (socket, req) => {
        webSocket.connectionCount++;
        log("New WebSocket Client Connection: " + req.socket.remoteAddress + req.socket.remotePort + ` (${webSocket.connectionCount} total)`);

        socket.on("close", () => {
            webSocket.connectionCount--;
            log("Client Disconnected WebSocket: " + req.socket.remoteAddress + req.socket.remotePort + ` (${webSocket.connectionCount} total)`);
        });
    });

    webSocket.on("close", () => {
        log("Close WebSocket");
    });

    webSocket.on("error", (error) => {
        logError(error.message);
    });

    webSocket.broadcast = (data) => {
        for (const client of webSocket.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        }
    };
    // HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
    webSocket.processMpegTs = (req: RequestExtend, res: Response) => {
        const address = req.socket.remoteAddress + ":" + req.socket.remotePort;

        if (req.headers.authorization !== config.websocket.secret) {
            log("Failed Stream Connection: " + address + " - wrong secret.");
            res.end();
            return;
        }
        if (!config.websocket.allowMultistream && clientAddress.has(address)) {
            log(`Multiple Streams not allowed (address: ${address})`);
            res.end();
            return;
        }
        if (res.socket)
            res.socket.setTimeout(0);

        clientAddress.add(address);
        const index = [...clientAddress].indexOf(address);

        log(`Stream Connected: ${index} (address: ${address})`);

        if (index === -1 || index > MAX_STREAMS) {
            log(`Stream limit exceeded! (address: ${address})`);
            res.end();
            return;
        }

        const packBf = bf.packBuffer({ packType: bf.PackType.Mpegts, data: index });

        req.on("data", (data) => {
            webSocket.broadcast(bf.packConcat(packBf, data));
        });

        req.on("close", () => {
            log(`Stream Disconnected: ${index} (address: ${address})`);

            webSocket.broadcast(bf.packBuffer({
                packType: bf.PackType.Event,
                data: index,
                type: bf.EventType.Close
            }));

            clientAddress.delete(address);
        });
    };

    return webSocket;
}


