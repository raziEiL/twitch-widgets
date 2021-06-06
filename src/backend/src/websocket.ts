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

const clientAddress = new Set<string>();

export function createSocket(server: Server) {
    const webSocket = new WebSocket.Server({ server }) as ServerExtend;
    webSocket.connectionCount = 0;

    webSocket.on("connection", (socket, req) => {
        webSocket.connectionCount++;
        log(`WebSocket client connected: ${req.socket.remoteAddress}${req.socket.remotePort} [${webSocket.connectionCount} total]`);

        socket.on("close", () => {
            webSocket.connectionCount--;
            log(`WebSocket client disconnected: ${req.socket.remoteAddress}${req.socket.remotePort} [${webSocket.connectionCount} total]`);
        });
    });

    webSocket.on("close", () => {
        log("WebSocket closed");
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
        const address = req.socket.remoteAddress + (config.videoChat.allowMultistream ? (":" + req.socket.remotePort) : "");

        if (config.videoChat.streamKey && req.headers.authorization != config.videoChat.streamKey) {
            log(`Broadcaster connection failed! address=${address} [wrong secret "${req.headers.authorization}"]`);
            res.end();
            return;
        }
        if (!config.videoChat.allowMultistream && clientAddress.has(address)) {
            log(`Broadcaster multiple streams not allowed! address=${address}`);
            res.end();
            return;
        }
        if (clientAddress.size >= config.videoChat.broadcastersLimit) {
            log(`Broadcasters limit exceeded! address=${address} [${clientAddress.size}/${config.videoChat.broadcastersLimit}]`);
            res.end();
            return;
        }

        clientAddress.add(address);
        const index = [...clientAddress].indexOf(address);
        const packBf = bf.packBuffer({ packType: bf.PackType.Mpegts, data: index });

        log(`Broadcaster connected: id=${index}, address=${address} [${clientAddress.size}/${config.videoChat.broadcastersLimit}]`);

        req.on("data", (data) => {
            webSocket.broadcast(bf.packConcat(packBf, data));
        });

        req.on("close", () => {
            webSocket.broadcast(bf.packBuffer({
                packType: bf.PackType.Event,
                data: index,
                type: bf.EventType.Close
            }));

            clientAddress.delete(address);
            log(`Broadcaster disconnected: id=${index}, address=${address} [${clientAddress.size}/${config.videoChat.broadcastersLimit}]`);
        });
    };

    return webSocket;
}