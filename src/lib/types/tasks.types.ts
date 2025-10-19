import {taskDefinitions} from "@/lib/server/domain/tasks/tasks-config";


export type BaseJobData = {
    triggeredBy: string;
};


export type CsvJobData = BaseJobData & {
    userId: string;
    filePath: string;
};


export type TaskJobData = BaseJobData | CsvJobData;
export type TaskDefinition = (typeof taskDefinitions)[number];
export type TasksName = (typeof taskDefinitions)[number]["name"];
