import {z} from "zod";
import {defineTask} from "@/lib/server/tasks/define-task";
import {dbMaintenanceTask} from "@/lib/server/tasks/definitions/db-maintenance.task";
import {lockOldMoviesTask} from "@/lib/server/tasks/definitions/lock-old-movies.task";
import {bulkMediaRefreshTask} from "@/lib/server/tasks/definitions/bulk-media-refresh.task";
import {removeNonListMediaTask} from "@/lib/server/tasks/definitions/remove-non-list-media.task";
import {computeAllUsersStatsTask} from "@/lib/server/tasks/definitions/compute-all-users-stats.task";
import {calculateAchievementsTask} from "@/lib/server/tasks/definitions/calculate-achievements.task";
import {addMediaNotificationsTask} from "@/lib/server/tasks/definitions/add-media-notifications.task";
import {addGenresToBooksUsingLlmTask} from "@/lib/server/tasks/definitions/add-books-genres-llm.task";
import {removeUnusedMediaCoversTask} from "@/lib/server/tasks/definitions/remove-unused-media-covers.task";
import {deleteNonActivatedUsersTask} from "@/lib/server/tasks/definitions/delete-non-activated-users.task";


export const maintenanceTask = defineTask({
    name: "maintenance" as const,
    visibility: "admin",
    description: "Run all daily maintenance tasks in sequence",
    inputSchema: z.object({}),
    handler: async (ctx, input) => {
        await ctx.step(deleteNonActivatedUsersTask.name, () => deleteNonActivatedUsersTask.handler(ctx, input));
        await ctx.step(removeNonListMediaTask.name, () => removeNonListMediaTask.handler(ctx, input));
        await ctx.step(removeUnusedMediaCoversTask.name, () => removeUnusedMediaCoversTask.handler(ctx, input));
        await ctx.step(bulkMediaRefreshTask.name, () => bulkMediaRefreshTask.handler(ctx, input));
        await ctx.step(addMediaNotificationsTask.name, () => addMediaNotificationsTask.handler(ctx, input));
        await ctx.step(lockOldMoviesTask.name, () => lockOldMoviesTask.handler(ctx, input));
        await ctx.step(computeAllUsersStatsTask.name, () => computeAllUsersStatsTask.handler(ctx, input));
        await ctx.step(calculateAchievementsTask.name, () => calculateAchievementsTask.handler(ctx, input));
        await ctx.step(dbMaintenanceTask.name, () => dbMaintenanceTask.handler(ctx, input));
        await ctx.step(addGenresToBooksUsingLlmTask.name, () => addGenresToBooksUsingLlmTask.handler(ctx, input));
    },
});
