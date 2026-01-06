import {hostname} from "os";
import {Writable} from "stream";
import pretty from "pino-pretty";
import pino, {Logger} from "pino";
import {TaskName} from "@/lib/server/tasks/registry";
import {LogTask, TaskTrigger} from "@/lib/types/tasks.types";


const pinoOptions: pino.LoggerOptions = {
    level: "info",
    base: {
        pid: process.pid,
        hostname: hostname(),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
};


class InMemoryLogStream extends Writable {
    public logs: LogTask[] = [];

    _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        try {
            this.logs.push(JSON.parse(chunk.toString()));
            callback();
        }
        catch (err) {
            callback(err as Error);
        }
    }
}


type CapturingLoggerResult = {
    logger: Logger;
    getLogs: () => LogTask[];
}


type CapturingLoggerOptions = {
    taskId: string;
    taskName: TaskName;
    stdoutAsJson?: boolean;
    triggeredBy: TaskTrigger;
}


export const createCapturingLogger = (task: CapturingLoggerOptions): CapturingLoggerResult => {
    const inMemoryStream = new InMemoryLogStream();

    const jsonMode = "stdoutAsJson" in task && Boolean(task.stdoutAsJson);
    const stdoutStream = jsonMode ? process.stdout : pretty({ colorize: true, translateTime: "HH:MM:ss.l", singleLine: false });

    const logger = pino(
        { ...pinoOptions, base: task },
        pino.multistream([
            { stream: stdoutStream },
            { stream: inMemoryStream },
        ])
    );

    return {
        logger,
        getLogs: () => inMemoryStream.logs,
    };
};
