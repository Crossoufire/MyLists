import {TaskName} from "@/lib/server/tasks/registry";
import {ProcessResult} from "@/lib/server/tasks/handlers/process-csv.task";


export type TaskVisibility = "admin" | "user";
export type TaskStatus = "completed" | "failed";
export type TaskTrigger = "user" | "cron/cli" | "dashboard";


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


export type SaveTaskToDb = {
    taskId: string,
    logs: LogTask[],
    userId?: number,
    startedAt: string,
    finishedAt: string,
    taskName: TaskName,
    status: TaskStatus;
    triggeredBy: TaskTrigger,
    errorMessage: string | null,
}
