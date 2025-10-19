import {taskDefinitions} from "@/lib/server/domain/tasks/tasks-config";


export type BaseJobData = {
    triggeredBy: "user" | "cron/cli" | "dashboard";
};


export type CsvJobData = BaseJobData & {
    userId: number;
    filePath: string;
};


export type TaskJobData = BaseJobData | CsvJobData;
export type TaskDefinition = (typeof taskDefinitions)[number];
export type TasksName = (typeof taskDefinitions)[number]["name"];
