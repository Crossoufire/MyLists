import pino from "pino";
import Redis from "ioredis";
import {Job, Queue, Worker} from "bullmq";
import {isJobCancelled} from "@/lib/utils/bullmq";
import pinoLogger from "@/lib/server/core/pino-logger";
import {getContainer} from "@/lib/server/core/container";
import {CancelJobError} from "@/lib/utils/error-classes";
import {Progress, TaskContext, TaskJobData, TasksName} from "@/lib/types/tasks.types";


type TypedJob = Job<TaskJobData, TaskReturnType, TasksName>;
type TaskReturnType = { result: "success" | "cancelled" | "failed" };


const QUEUE_NAME = "mylists-tasks";
export let mylistsTaskQueue: Queue<TaskJobData, TaskReturnType, TasksName>;


export const initializeQueue = (connection: Redis) => {
    if (mylistsTaskQueue) {
        return mylistsTaskQueue;
    }

    mylistsTaskQueue = new Queue(QUEUE_NAME, {
        connection: connection.duplicate(),
        defaultJobOptions: {
            attempts: 2,
            removeOnComplete: { count: 25 },
            removeOnFail: { count: 25 },
        },
    });

    pinoLogger.info("BullMQ queue initialized.");

    return mylistsTaskQueue;
};


export const createWorker = (connection: Redis) => {
    const worker = new Worker<TaskJobData, TaskReturnType, TasksName>(QUEUE_NAME, taskProcessor, {
        concurrency: 1,
        connection: connection.duplicate(),
    });

    worker.on("completed", (job, returnValue) => {
        if (returnValue.result === "cancelled") {
            pinoLogger.info({ jobId: job.id, taskName: job.name }, "Worker task cancelled");
        }
        else {
            pinoLogger.info({ jobId: job.id, taskName: job.name, returnValue }, "Worker completed task");
        }
    });

    worker.on("failed", (job: TypedJob | undefined, error: Error) => {
        pinoLogger.error({ jobId: job?.id, taskName: job?.name, err: error }, "Worker failed task");
    });

    worker.on("error", (err) => {
        pinoLogger.error({ err }, "Worker encountered an error");
    });

    pinoLogger.info("Worker instance created and listeners attached.");

    return worker;
};


const taskProcessor = async (job: TypedJob): Promise<TaskReturnType> => {
    const { name: taskName, data: jobData, id: jobId } = job;

    const baseJobLogger = pinoLogger.child({ jobId, taskName, triggeredBy: jobData.triggeredBy });
    const jobLogStream = { write: (msg: string) => job.log(msg.replace(/\n$/, "")) };
    const taskExecutionLogger = pino(
        {
            level: baseJobLogger.level,
            base: { jobId, taskName, triggeredBy: jobData.triggeredBy },
        },
        pino.multistream([
            { stream: jobLogStream, level: "info" },
            { stream: process.stdout, level: baseJobLogger.level },
        ]),
    );

    taskExecutionLogger.info("Starting task processing...");
    await job.log(`Starting task processing triggered by ${jobData.triggeredBy}...`);

    try {
        const container = await getContainer({ tasksServiceLogger: taskExecutionLogger });
        const tasksService = container.services.tasks;

        const cancelCallback = async () => {
            if (await isJobCancelled(jobId!)) {
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
            triggeredBy: jobData.triggeredBy,
        };

        await tasksService.runTask(context);

        await job.log("Task completed successfully.");
        taskExecutionLogger.info("Task completed successfully.");

        return { result: "success" };
    }
    catch (error: any) {
        if (error instanceof CancelJobError) {
            await job.log("Task cancelled");
            taskExecutionLogger.warn("Task cancelled");
            return { result: "cancelled" };
        }

        await job.log(`Task failed: ${error.message}`);
        taskExecutionLogger.error({ err: error }, "Task failed.");

        throw error;
    }
};
