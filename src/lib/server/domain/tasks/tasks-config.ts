export const taskDefinitions = [
    { name: "vacuumDb", description: "Vacuum the database" },
    { name: "analyzeDb", description: "Analyze the database" },
    { name: "updateIgdbToken", description: "Update the IGDB API token" },
    { name: "computeAllUsersStats", description: "Compute all users stats" },
    { name: "lockOldMovies", description: "Lock old movies from the database" },
    { name: "calculateAchievements", description: "Compute all users Achievements" },
    { name: "addMediaNotifications", description: "Add media notifications to users" },
    { name: "maintenanceTasks", description: "Run all maintenance tasks in sequence" },
    { name: "addGenresToBooksUsingLLM", description: "Like the name of this task say" },
    { name: "seedAchievements", description: "Apply seed achievements to the database" },
    { name: "removeNonListMedia", description: "Remove non-list media from the database" },
    { name: "bulkMediaRefresh", description: "- Bulk refresh media data from APIs provider" },
    { name: "removeUnusedMediaCovers", description: "Remove unused media covers from the database" },
    { name: "deleteNonActivatedUsers", description: "Delete non-activated users older than a week" },
] as const;


export const taskNames = taskDefinitions.map((task) => task.name);
