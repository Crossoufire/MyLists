import {TaskDefinition} from "@/lib/types/tasks.types";


export const taskNames = [
    "dbMaintenance",
    "updateIgdbToken",
    "computeAllUsersStats",
    "lockOldMovies",
    "calculateAchievements",
    "addMediaNotifications",
    "maintenanceTasks",
    "addGenresToBooksUsingLlm",
    "seedAchievements",
    "removeNonListMedia",
    "bulkMediaRefresh",
    "removeUnusedMediaCovers",
    "deleteNonActivatedUsers",
    "processCsv",
    "checkHltbWorks",
] as const;


export const taskDefinitions: TaskDefinition[] = [
    { name: "updateIgdbToken", description: "Update the IGDB API token" },
    { name: "computeAllUsersStats", description: "Compute all users stats" },
    { name: "lockOldMovies", description: "Lock old movies from the database" },
    { name: "calculateAchievements", description: "Compute all users Achievements" },
    { name: "addMediaNotifications", description: "Add media notifications to users" },
    { name: "maintenanceTasks", description: "Run all maintenance tasks in sequence" },
    { name: "addGenresToBooksUsingLlm", description: "Like the name of this task say" },
    { name: "seedAchievements", description: "Apply seed achievements to the database" },
    { name: "checkHltbWorks", description: "As the name suggests, check that HLTB works" },
    { name: "removeNonListMedia", description: "Remove non-list media from the database" },
    { name: "dbMaintenance", description: "WAL checkpoint, Vacuum, and Analyze on the db" },
    { name: "bulkMediaRefresh", description: "Bulk refresh media data from APIs provider" },
    { name: "removeUnusedMediaCovers", description: "Remove unused media covers from the database" },
    { name: "deleteNonActivatedUsers", description: "Delete non-activated users older than a week" },
    // TODO: Not Implemented yet.
    {
        name: "processCsv",
        visibility: "user",
        description: "Process a CSV file for a specific user.",
        options: [
            {
                required: true,
                flags: "-u, --userId <userId>",
                description: "The ID of the user to process the CSV for",
            },
            {
                required: true,
                flags: "-f, --filePath <filePath>",
                description: "Path to the CSV file",
            },
        ],
    },
];
