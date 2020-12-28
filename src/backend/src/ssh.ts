
import child_process from "child_process";
import fs from "fs";
import path from "path";
import { rootPath, config } from "./pkg-config";
import { logError, log } from "./helpers";

const SSH_KEY_NAME = "ssh_rsa";
const SSH_KEY_PATH = path.join(rootPath, SSH_KEY_NAME);
const CONNECTED_MESSAGE = "tunneled with tls termination";

export function processSsh() {
    if (!fs.existsSync(SSH_KEY_PATH)) {
        const workerProcess = child_process.exec(`ssh-keygen -t rsa -b 4096 -N "" -f "${SSH_KEY_PATH}"`, (error, stdout, stderr) => {
            if (error) {
                logError(error.stack);
                logError("Error code: " + error.code);
                logError("Signal received: " + error.signal);
            }
            /*             log("stdout: " + stdout);
                        log("stderr: " + stderr); */
        });
        workerProcess.on("close", ssh);
    }
    else {
        // ssh-key already exits
        ssh();
    }
}

export function ssh() {
    const workerProcess = child_process.exec(`ssh -R 80:localhost:${config.twitch.httpPort} ssh.localhost.run -tt -i "${SSH_KEY_PATH}" -o StrictHostKeyChecking=no`, (error, stdout, stderr) => {
        if (error) {
            logError(error.stack);
            logError("Error code: " + error.code);
            logError("Signal received: " + error.signal);
        }
        /*       log("stdout: " + stdout);
                log("stderr: " + stderr); */
    });
    if (workerProcess.stdout)
        workerProcess.stdout.on("data", chunk => {
            if (!chunk) return;
            const connected = (chunk as string).includes(CONNECTED_MESSAGE);

            if (connected) {
                const message = (chunk as string).replace(CONNECTED_MESSAGE, "").trim();
                log("Public web server URL: " + message);
            }
        });
}