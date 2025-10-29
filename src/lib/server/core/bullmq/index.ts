import Redis from "ioredis";
import {Queue, Worker} from "bullmq";
import {serverEnv} from "@/env/server";
import {CancelJobError} from "@/lib/utils/error-classes";
import {executeTask} from "@/lib/server/core/task-runner";
import {isJobCancelled, saveJobToDb} from "@/lib/utils/bullmq";
import {createDummyQueue} from "@/lib/server/core/bullmq/dummy";
import {getRedisConnection} from "@/lib/server/core/redis-client";
import {createTaskLogger, rootLogger} from "@/lib/server/core/logger";
import {Progress, TaskContext, TaskJobData, TaskName, TaskReturnType, TypedJob} from "@/lib/types/tasks.types";


const QUEUE_NAME = "mylists-tasks";
let mylistsTaskQueue: Queue<TaskJobData, TaskReturnType, TaskName>;


export const createOrGetQueue = async () => {
    if (mylistsTaskQueue) {
        return mylistsTaskQueue;
    }

    if (!serverEnv.REDIS_ENABLED) {
        rootLogger.info("Redis not Enabled. Using Dummy Queue.");
        mylistsTaskQueue = createDummyQueue();
        return mylistsTaskQueue;
    }

    const connection = await getRedisConnection();
    mylistsTaskQueue = new Queue(QUEUE_NAME, {
        connection: connection.duplicate(),
        defaultJobOptions: {
            attempts: 1,
            removeOnFail: 10,
            removeOnComplete: 10,
        },
    });
    rootLogger.info("Mylists-tasks queue initialized.");

    return mylistsTaskQueue;
};


export const createWorker = (connection: Redis) => {
    const worker = new Worker<TaskJobData, TaskReturnType, TaskName>(QUEUE_NAME, taskProcessor, {
        concurrency: 1,
        connection: connection.duplicate(),
    });

    worker.on("error", (err) => {
        rootLogger.error({ err }, "Worker encountered an error");
    });

    worker.on("failed", async (job, error) => {
        rootLogger.error({ jobId: job?.id, taskName: job?.name, err: error }, "Worker failed task");

        await saveJobToDb(job, "failed");
    });

    worker.on("completed", async (job, returnValue) => {
        if (returnValue.result === "cancelled") {
            rootLogger.info({ jobId: job.id, taskName: job.name }, "Worker task cancelled");
        }
        else {
            rootLogger.info({ jobId: job.id, taskName: job.name, returnValue }, "Worker completed task");
        }

        await saveJobToDb(job, "completed", returnValue);
    });

    rootLogger.info("Worker instance created and listeners attached.");

    return worker;
};


const taskProcessor = async (job: TypedJob): Promise<TaskReturnType> => {
    const { name: taskName, data: jobData } = job;

    const taskLogger = createTaskLogger({ job, taskName, ...jobData });
    taskLogger.info(`Starting task processing triggered by ${jobData.triggeredBy}...`);

    try {
        const cancelCallback = async () => {
            if (await isJobCancelled(job.id!)) {
                throw new CancelJobError("Canceled");
            }
        };

        const progressCallback = async (progress: Progress) => {
            await job.updateProgress(progress);
            await job.log(JSON.stringify(progress));
        };

        const context: TaskContext = {
            taskName,
            data: jobData,
            cancelCallback,
            progressCallback,
            logger: taskLogger,
            triggeredBy: jobData.triggeredBy,
        };

        await executeTask(context);

        taskLogger.info("Task completed successfully.");

        return { result: "success" };
    }
    catch (error: any) {
        if (error instanceof CancelJobError) {
            taskLogger.warn("Task cancelled");
            return { result: "cancelled" };
        }

        taskLogger.error({ err: error }, "Task failed.");
        throw error;
    }
};
