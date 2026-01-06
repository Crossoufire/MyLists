import {z} from "zod";
import {Logger} from "pino";
import {TaskTrigger, TaskVisibility} from "@/lib/types/tasks.types";


type TaskMeta = {
    description: string;
    visibility?: TaskVisibility;
};


type TaskContext<TInput> = {
    input: TInput;
    logger: Logger;
    taskId: string;
    triggeredBy: TaskTrigger;
};


export type TaskDefinition<TInput extends z.ZodSchema = z.ZodSchema> = {
    meta: TaskMeta;
    inputSchema: TInput;
    handler: (ctx: TaskContext<z.infer<TInput>>) => Promise<void>;
};


export type RegisteredTask<TName, TInput extends z.ZodSchema> = TaskDefinition<TInput> & { name: TName };


export const defineTask = <TInput extends z.ZodSchema>(def: TaskDefinition<TInput>): TaskDefinition<TInput> => {
    return def;
}


export const createTaskRegistry = <T extends Record<string, TaskDefinition>>(tasks: T): { [K in keyof T]: RegisteredTask<K, T[K]["inputSchema"]> } => {
    const result: any = {};
    for (const key of Object.keys(tasks)) {
        result[key] = { ...tasks[key], name: key };
    }

    return result;
};
