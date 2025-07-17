import pino from "pino";
import Redis from "ioredis";
import {TasksName} from "@/cli/commands";
import {Job, Queue, Worker} from "bullmq";
import pinoLogger from "@/lib/server/core/pino-logger";
import {getContainer} from "@/lib/server/core/container";


export type TypedJob = Job<LongTaskJobData, any, TasksName>;
type LongTaskJobData = {
    triggeredBy: string;
}


const QUEUE_NAME = "mylists-long-tasks";
export let mylistsLongTaskQueue: Queue<LongTaskJobData, any, TasksName>;


export const initializeQueue = (connection: Redis) => {
    if (mylistsLongTaskQueue) return mylistsLongTaskQueue;

    mylistsLongTaskQueue = new Queue(QUEUE_NAME, {
        connection: connection.duplicate(),
        defaultJobOptions: {
            attempts: 2,
            removeOnComplete: { count: 25 },
            removeOnFail: { count: 25 },
        },
    });

    pinoLogger.info("BullMQ queue initialized.");

    return mylistsLongTaskQueue;
};


export const createWorker = (connection: Redis) => {
    const worker = new Worker<LongTaskJobData, any, TasksName>(QUEUE_NAME, taskProcessor, {
        connection: connection.duplicate(),
        concurrency: 1,
    });

    worker.on("completed", (job: TypedJob, returnValue: any) => {
        pinoLogger.info({ jobId: job.id, taskName: job.name, returnValue }, "Worker completed job");
    });
    worker.on("failed", (job: TypedJob | undefined, error: Error) => {
        pinoLogger.error({ jobId: job?.id, taskName: job?.name, err: error }, "Worker failed job");
    });
    worker.on("error", (err) => {
        pinoLogger.error({ err }, "Worker encountered an error");
    });

    pinoLogger.info("Worker instance created and listeners attached.");

    return worker;
};


const taskProcessor = async (job: TypedJob) => {
    const { name: taskName } = job;
    const { triggeredBy } = job.data;

    const baseJobLogger = pinoLogger.child({ jobId: job.id, taskName, triggeredBy });
    const taskExecutionLogger = pino({
            level: baseJobLogger.level,
            base: {
                taskName,
                triggeredBy,
                jobId: job.id,
            },
        },
        pino.multistream([
            {
                stream: process.stdout,
                level: baseJobLogger.level,
            },
            {
                stream: { write: (msg: string) => job.log(msg.replace(/\n$/, "")) },
                level: "info",
            }
        ]),
    );

    taskExecutionLogger.info("Starting task processing...");
    await job.log(`Starting task processing triggered by ${triggeredBy}...`);

    try {
        const container = await getContainer({ tasksServiceLogger: taskExecutionLogger });
        const tasksService = container.services.tasks;
        await tasksService.runTask(taskName);

        taskExecutionLogger.info("Task completed successfully.");
        await job.log("Task completed successfully.");

        return { result: "success" };
    }
    catch (error: any) {
        taskExecutionLogger.error({ err: error }, "Task failed.");
        await job.log(`Task failed: ${error.message}`);
        throw error;
    }
};
