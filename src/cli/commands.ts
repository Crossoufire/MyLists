import {Command} from "commander";
import {registerTaskCommand} from "@/cli/register-helper";


export type TasksName = TaskDefinition["name"];
export type TaskDefinition = (typeof taskDefinitions)[number];


export const taskDefinitions = [
    {
        name: "deleteNonActivatedUsers",
        description: "Delete non-activated users older than a week",
        handlerMethod: "runDeleteNonActivatedUsers",
    },
    {
        name: "vacuumDB",
        description: "Vacuum the database",
        handlerMethod: "runVacuumDB",
    },
    {
        name: "analyzeDB",
        description: "Analyze the database",
        handlerMethod: "runAnalyzeDB",
    },
    {
        name: "lockOldMovies",
        description: "Lock old movies from the database",
        handlerMethod: "runLockOldMovies",
    },
    {
        name: "bulkMediaRefresh",
        description: "Bulk refresh media data from APIs provider",
        handlerMethod: "runBulkMediaRefresh",
    },
    {
        name: "seedAchievements",
        description: "Apply seed achievements to the database",
        handlerMethod: "runSeedAchievements",
    },
    {
        name: "removeNonListMedia",
        description: "Remove non-list media from the database",
        handlerMethod: "runRemoveNonListMedia",
    },
    {
        name: "removeUnusedMediaCovers",
        description: "Remove unused media covers from the database",
        handlerMethod: "runRemoveUnusedMediaCovers",
    },
    {
        name: "addMediaNotifications",
        description: "Add media notifications to users",
        handlerMethod: "runAddMediaNotifications",
    },
    {
        name: "computeAllUsersStats",
        description: "Compute all users stats",
        handlerMethod: "runComputeAllUsersStats",
    },
    {
        name: "calculateAchievements",
        description: "Compute all users Achievements",
        handlerMethod: "runCalculateAchievements",
    },
    {
        name: "updateIgdbToken",
        description: "Update the IGDB API token",
        handlerMethod: "runUpdateIgdbToken",
    },
    {
        name: "maintenanceTasks",
        description: "Run all maintenance tasks in sequence",
        handlerMethod: "runMaintenanceTasks",
    },
] as const;


export const registerAllCommands = (program: Command) => {
    for (const taskDef of taskDefinitions) {
        registerTaskCommand({
            program,
            taskName: taskDef.name,
            description: taskDef.description,
        });
    }
}
