import {z} from "zod";
import {TaskMetadata} from "@/lib/types/tasks.types";
import {createUserTask} from "@/lib/server/tasks/definitions/create-user.task";
import {maintenanceTask} from "@/lib/server/tasks/definitions/maintenance.task";
import {dbMaintenanceTask} from "@/lib/server/tasks/definitions/db-maintenance.task";
import {lockOldMoviesTask} from "@/lib/server/tasks/definitions/lock-old-movies.task";
import {checkHltbWorksTask} from "@/lib/server/tasks/definitions/check-hltb-works.task";
import {updateIgdbTokenTask} from "@/lib/server/tasks/definitions/update-igdb-token.task";
import {seedAchievementsTask} from "@/lib/server/tasks/definitions/seed-achievements.task";
import {bulkMediaRefreshTask} from "@/lib/server/tasks/definitions/bulk-media-refresh.task";
import {removeNonListMediaTask} from "@/lib/server/tasks/definitions/remove-non-list-media.task";
import {calculateAchievementsTask} from "@/lib/server/tasks/definitions/calculate-achievements.task";
import {computeAllUsersStatsTask} from "@/lib/server/tasks/definitions/compute-all-users-stats.task";
import {addGenresToBooksUsingLlmTask} from "@/lib/server/tasks/definitions/add-books-genres-llm.task";
import {addMediaNotificationsTask} from "@/lib/server/tasks/definitions/add-media-notifications.task";
import {deleteNonActivatedUsersTask} from "@/lib/server/tasks/definitions/delete-non-activated-users.task";
import {removeUnusedMediaCoversTask} from "@/lib/server/tasks/definitions/remove-unused-media-covers.task";


export const taskRegistry = {
    [createUserTask.name]: createUserTask,
    [maintenanceTask.name]: maintenanceTask,
    [lockOldMoviesTask.name]: lockOldMoviesTask,
    [dbMaintenanceTask.name]: dbMaintenanceTask,
    [checkHltbWorksTask.name]: checkHltbWorksTask,
    [updateIgdbTokenTask.name]: updateIgdbTokenTask,
    [bulkMediaRefreshTask.name]: bulkMediaRefreshTask,
    [seedAchievementsTask.name]: seedAchievementsTask,
    [removeNonListMediaTask.name]: removeNonListMediaTask,
    [computeAllUsersStatsTask.name]: computeAllUsersStatsTask,
    [addMediaNotificationsTask.name]: addMediaNotificationsTask,
    [calculateAchievementsTask.name]: calculateAchievementsTask,
    [deleteNonActivatedUsersTask.name]: deleteNonActivatedUsersTask,
    [removeUnusedMediaCoversTask.name]: removeUnusedMediaCoversTask,
    [addGenresToBooksUsingLlmTask.name]: addGenresToBooksUsingLlmTask,
};


export type TaskName = keyof typeof taskRegistry;


export const getTask = (name: string) => {
    const task = taskRegistry[name as TaskName];
    if (!task) return null;
    return task;
};


export const getAllTasks = () => {
    return Object.values(taskRegistry);
};


export const getAllTasksMetadata = (): TaskMetadata[] => {
    return getAllTasks().map((task) => ({
        name: task.name,
        visibility: task.visibility,
        description: task.description,
        inputSchema: zodToJsonSchema(task.inputSchema),
    }));
}


function zodToJsonSchema(schema: z.ZodType): TaskMetadata["inputSchema"] {
    const properties: TaskMetadata["inputSchema"]["properties"] = {};

    if (schema instanceof z.ZodObject) {
        const shape = schema.shape as Record<string, z.ZodType>;

        for (const [key, fieldSchema] of Object.entries(shape)) {
            let required = true;
            let defaultValue: any;
            let innerSchema = fieldSchema;

            if (innerSchema instanceof z.ZodOptional) {
                required = false;
                innerSchema = innerSchema.unwrap() as any;
            }

            if (innerSchema instanceof z.ZodDefault) {
                defaultValue = innerSchema.def.defaultValue as any;
                innerSchema = innerSchema.def.innerType as any;
            }

            let type = "string";
            if (innerSchema instanceof z.ZodNumber) type = "number";
            else if (innerSchema instanceof z.ZodBoolean) type = "boolean";
            else if (innerSchema instanceof z.ZodArray) type = "array";
            else if (innerSchema instanceof z.ZodEnum) type = "enum";

            properties[key] = {
                type,
                required,
                default: defaultValue,
                description: innerSchema.description,
            };
        }
    }

    return { type: "object", properties };
}
