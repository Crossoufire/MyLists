import pino from "pino";
import {TasksName} from "@/cli/commands";
import {Job, Queue, Worker} from "bullmq";
import pinoLogger from "@/lib/server/core/pino-logger";
import {connectRedis} from "@/lib/server/core/redis-client";
import {initializeContainer} from "@/lib/server/core/container";


// Create Redis connection even if not in prod
const connection = await connectRedis({ bypassEnv: true });
if (!connection) {
    throw new Error("Failed to connect to Redis.");
}


const queueConnection = connection.duplicate();
const workerConnection = connection.duplicate();


const QUEUE_NAME = "mylists-long-tasks";


export const mylistsLongTaskQueue = new Queue(QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
        attempts: 2,
        removeOnComplete: { count: 25 },
        removeOnFail: { count: 25 },
    },
});


const taskProcessor = async (job: Job) => {
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
                level: baseJobLogger.level as pino.Level,
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
        const container = await initializeContainer({ tasksServiceLogger: taskExecutionLogger });
        const tasksService = container.services.tasks;
        await tasksService.runTask(taskName as TasksName);

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


export const createWorker = () => {
    const worker = new Worker(QUEUE_NAME, taskProcessor, {
        connection: workerConnection,
        concurrency: 1,
    });

    worker.on("completed", (job: Job, returnValue: any) => {
        pinoLogger.info({ jobId: job.id, taskName: job.name, returnValue }, "Worker completed job");
    });
    worker.on("failed", (job: Job | undefined, error: Error) => {
        pinoLogger.error({ jobId: job?.id, taskName: job?.name, err: error }, "Worker failed job");
    });
    worker.on("error", (err) => {
        pinoLogger.error({ err }, "Worker encountered an error");
    });

    pinoLogger.info("Worker instance created and listeners attached.");

    return worker;
};
