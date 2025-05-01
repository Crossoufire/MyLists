import pino from "pino";
import {hostname} from "os";


const pinoLogger = pino({
    level: "info",
    base: {
        pid: process.pid,
        hostname: hostname(),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});


export default pinoLogger;
