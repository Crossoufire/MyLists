import {Job} from "bullmq";
import {Logger} from "pino";
import {taskNames} from "@/lib/server/domain/tasks/tasks-config";


export type TaskContext = {
    logger: Logger;
    data: TaskJobData,
    taskName: TaskName,
    triggeredBy: string,
    cancelCallback?: CancelCallback,
    progressCallback?: ProgressCallback,
};


export type JobProgress = {
    total: number,
    message: string,
    current: number,
}


export type BaseJobData = {
    triggeredBy: "user" | "cron/cli" | "dashboard",
};


export type CsvJobData = BaseJobData & {
    userId: number,
    fileName: string,
    filePath: string,
};


export type TaskDefinition = {
    name: TaskName,
    description: string,
    visibility?: "user" | "admin",
    options?: {
        flags: string,
        required: boolean,
        description: string,
    }[],
}
export type CancelCallback = () => Promise<void>;
export type TaskName = (typeof taskNames)[number];
export type TaskJobData = BaseJobData | CsvJobData;
export type TaskLogs = { logs: string[], count: number };
export type TaskHandler = (ctx: TaskContext) => Promise<void>;
export type TypedJob = Job<TaskJobData, TaskReturnType, TaskName>;
export type ProgressCallback = (progress: Progress) => Promise<void>;
export type Progress = { current: number, total: number, message: string };
export type TaskReturnType = { result: "success" | "cancelled" | "failed" };
