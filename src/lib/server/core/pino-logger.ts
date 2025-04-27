import pino from "pino";
import {hostname} from "os";


const pinoLogger = pino({
    level: process.env.LOG_LEVEL || "info",
    base: {
        pid: process.pid,
        hostname: hostname(),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});


export default pinoLogger;
