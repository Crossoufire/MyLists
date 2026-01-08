import {z} from "zod";
import {TaskVisibility} from "@/lib/types/tasks.types";
import {TaskContext} from "@/lib/server/tasks/task-context";


export type TaskDefinition<TName extends string, TInputSchema extends z.ZodType> = {
    name: TName;
    description: string;
    inputSchema: TInputSchema;
    visibility: TaskVisibility;
    handler: (ctx: TaskContext, input: z.infer<TInputSchema>) => Promise<void>;
};


export const defineTask = <
    TName extends string,
    TInputSchema extends z.ZodType,
>(def: TaskDefinition<TName, TInputSchema>): TaskDefinition<TName, TInputSchema> => {
    return def;
}
