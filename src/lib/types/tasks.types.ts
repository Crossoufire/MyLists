import {Logger} from "pino";
import {taskNames} from "@/lib/server/domain/tasks/tasks-config";
import {ProcessResult} from "@/lib/server/domain/tasks/tasks.service";


export type LogTask = {
    msg: string,
    time: string,
    level: number,
    json?: object,
    command: string,
    taskName: string,
    triggeredBy: string,
    durationMs?: number,
    result?: ProcessResult,
}


export type TaskData = {
    taskId: string,
    userId?: number,
    filePath?: string,
    taskName: TaskName,
    stdoutAsJson?: boolean,
    triggeredBy: "user" | "cron/cli" | "dashboard",
};


export type TaskContext = {
    data: TaskData,
    logger: Logger,
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


export type SaveToDbProps = {
    taskId: string,
    logs: LogTask[],
    userId?: number,
    startedAt: string,
    finishedAt: string,
    taskName: TaskName,
    errorMessage: string | null,
    status: "completed" | "failed";
    triggeredBy: "user" | "cron/cli" | "dashboard",
}


export type TaskName = (typeof taskNames)[number];
export type TaskHandler = (ctx: TaskContext) => Promise<void>;
