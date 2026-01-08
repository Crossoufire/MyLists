import {TaskName} from "@/lib/server/tasks/registry";


export type TaskVisibility = "admin" | "user";
export type TaskStatus = "completed" | "failed" | "partial";
export type TaskTrigger = "user" | "cron/cli" | "dashboard";

export type TaskStep = {
    name: string;
    error?: string;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    children?: TaskStep[];
    metrics: Record<string, number | string>;
    status: "completed" | "failed" | "skipped" | "partial";
};

export type TaskLog = {
    time: string;
    step?: string;
    message: string;
    data?: Record<string, any>;
    level: "info" | "warn" | "error";
};


export type TaskResult = {
    taskId: string;
    logs: TaskLog[];
    taskName: string;
    startedAt: string;
    steps: TaskStep[];
    finishedAt: string;
    durationMs: number;
    status: TaskStatus;
    triggeredBy: TaskTrigger;
    errorMessage: string | null;
    metrics: Record<string, number | string>;
};


export type TaskMetadata = {
    name: string;
    description: string;
    visibility: TaskVisibility;
    inputSchema: {
        type: string;
        properties: Record<string, {
            type: string;
            default?: any;
            enum?: string[];
            required: boolean;
            description?: string;
        }>;
    };
}


export type SaveTaskToDb = {
    taskId: string,
    userId?: number,
    logs: TaskResult,
    startedAt: string,
    finishedAt: string,
    taskName: TaskName,
    status: TaskStatus;
    triggeredBy: TaskTrigger,
    errorMessage: string | null,
}
