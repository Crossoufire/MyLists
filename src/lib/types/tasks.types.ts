import {taskDefinitions} from "@/lib/server/domain/tasks/tasks-config";


export interface TaskContext {
    data: TaskJobData;
    taskName: TasksName;
    triggeredBy: string;
    cancelCallback?: CancelCallback;
    progressCallback?: ProgressCallback;
}


export type JobProgress = {
    total: number,
    message: string,
    current: number,
}


export type BaseJobData = {
    triggeredBy: "user" | "cron/cli" | "dashboard";
};


export type CsvJobData = BaseJobData & {
    userId: number;
    fileName: string;
    filePath: string;
};

export type CancelCallback = () => Promise<void>;
export type TaskJobData = BaseJobData | CsvJobData;
export type TaskDefinition = (typeof taskDefinitions)[number];
export type TasksName = (typeof taskDefinitions)[number]["name"];
export type ProgressCallback = (progress: Progress) => Promise<void>;
export type Progress = { current: number, total: number, message: string };
