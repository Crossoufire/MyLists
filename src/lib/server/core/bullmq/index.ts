import pino from "pino";
import Redis from "ioredis";
import {Job, Queue, Worker} from "bullmq";
import pinoLogger from "@/lib/server/core/pino-logger";
import {getContainer} from "@/lib/server/core/container";
import {TaskJobData, TasksName} from "@/lib/types/tasks.types";


type TypedJob = Job<TaskJobData, any, TasksName>;


const QUEUE_NAME = "mylists-tasks";
export let mylistsTaskQueue: Queue<TaskJobData, any, TasksName>;


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
    const worker = new Worker<TaskJobData, any, TasksName>(QUEUE_NAME, taskProcessor, {
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
        await tasksService.runTask(taskName, jobData);

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
