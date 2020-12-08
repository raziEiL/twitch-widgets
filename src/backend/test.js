
const path = require("path");

const isPkg = __dirname.includes("snapshot");
const configFilename = path.join(isPkg ? path.dirname(process.execPath) : (__dirname + "/../../"), "config.json");

console.log(isPkg);
console.log(configFilename);