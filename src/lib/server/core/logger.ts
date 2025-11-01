import {hostname} from "os";
import {Writable} from "stream";
import pino, {Logger} from "pino";
import {LogTask, TaskData} from "@/lib/types/tasks.types";


const pinoOptions: pino.LoggerOptions = {
    level: "info",
    base: {
        pid: process.pid,
        hostname: hostname(),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
};


export const rootLogger = pino(pinoOptions);


export class InMemoryLogStream extends Writable {
    public logs: LogTask[] = [];

    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        try {
            this.logs.push(JSON.parse(chunk.toString()));
            callback();
        }
        catch (err) {
            callback(err as Error);
        }
    }
}


interface CapturingLoggerResult {
    logger: Logger;
    getLogs: () => LogTask[];
}


export const createCapturingLogger = (base: TaskData): CapturingLoggerResult => {
    const inMemoryStream = new InMemoryLogStream();

    const logger = pino(
        { ...pinoOptions, base },
        pino.multistream([
            { stream: process.stdout },
            { stream: inMemoryStream },
        ])
    );

    return {
        logger,
        getLogs: () => inMemoryStream.logs,
    };
};
