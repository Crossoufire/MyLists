import {Job, Queue, Worker} from "bullmq";
import pinoLogger from "@/lib/server/core/pino-logger";
import {getContainer} from "@/lib/server/core/container";
import {connectRedis} from "@/lib/server/core/redis-client";


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
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
    },
});

const taskProcessor = async (job: Job) => {
    const { taskName, triggeredBy } = job.data;
    const jobLogger = pinoLogger.child({ jobId: job.id, taskName, triggeredBy });

    jobLogger.info("Starting task processing...");
    await job.log(`Starting task processing triggered by ${triggeredBy}...`);

    try {
        const tasksService = getContainer().services.tasks;
        await tasksService.runTask(taskName);

        jobLogger.info("Task completed successfully.");
        await job.log("Task completed successfully.");
        return { result: "success" };
    }
    catch (error: any) {
        jobLogger.error({ err: error }, "Task failed.");
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
        pinoLogger.info({ jobId: job.id, taskName: job.data.taskName, returnValue }, "Worker completed job");
    });
    worker.on("failed", (job: Job | undefined, error: Error) => {
        pinoLogger.error({ jobId: job?.id, taskName: job?.data.taskName, err: error }, "Worker failed job");
    });
    worker.on("error", (err) => {
        pinoLogger.error({ err }, "Worker encountered an error");
    });

    pinoLogger.info("Worker instance created and listeners attached.");

    return worker;
};
