import {Command} from "commander";
import {registerTaskCommand} from "@/cli/register-helper";


export type TasksName = TaskDefinition["name"];
export type TaskDefinition = (typeof taskDefinitions)[number];


export const taskDefinitions = [
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
