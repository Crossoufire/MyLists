import pino from "pino";
import {Job} from "bullmq";
import {hostname} from "os";
import {TaskJobData} from "@/lib/types/tasks.types";


const pinoOptions: pino.LoggerOptions = {
    level: "info",
    base: {
        pid: process.pid,
        hostname: hostname(),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
};


export const rootLogger = pino(pinoOptions);


interface TaskLoggerContext {
    taskName: string;
    [key: string]: any;
    triggeredBy: string;
    job?: Job<TaskJobData>;
}


export function createTaskLogger(ctx: TaskLoggerContext) {
    const { job, ...context } = ctx;

    const base = {
        ...context,
        jobId: job?.id,
    };

    // BullMQ jobs, multistream logger - logs stdout and job's log
    if (job) {
        return pino(
            { ...pinoOptions, base },
            pino.multistream([
                { stream: process.stdout },
                { stream: { write: (msg: string) => job.log(msg.replace(/\n$/, "")) } },
            ])
        );
    }

    // Direct CLI or other contexts, create root logger child
    return rootLogger.child(base);
}
