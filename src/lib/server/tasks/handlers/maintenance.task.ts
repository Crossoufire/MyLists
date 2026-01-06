import {z} from "zod";
import {defineTask} from "@/lib/server/tasks/define-task";
import {dbMaintenanceTask} from "@/lib/server/tasks/handlers/db-maintenance.task";
import {lockOldMoviesTask} from "@/lib/server/tasks/handlers/lock-old-movies.task";
import {bulkMediaRefreshTask} from "@/lib/server/tasks/handlers/bulk-media-refresh.task";
import {removeNonListMediaTask} from "@/lib/server/tasks/handlers/remove-non-list-media.task";
import {computeAllUsersStatsTask} from "@/lib/server/tasks/handlers/compute-all-users-stats.task";
import {calculateAchievementsTask} from "@/lib/server/tasks/handlers/calculate-achievements.task";
import {addMediaNotificationsTask} from "@/lib/server/tasks/handlers/add-media-notifications.task";
import {addGenresToBooksUsingLlmTask} from "@/lib/server/tasks/handlers/add-books-genres-llm.task";
import {removeUnusedMediaCoversTask} from "@/lib/server/tasks/handlers/remove-unused-media-covers.task";
import {deleteNonActivatedUsersTask} from "@/lib/server/tasks/handlers/delete-non-activated-users.task";


export const maintenanceTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Run all daily maintenance tasks in sequence",
    },
    inputSchema: z.object({}),
    handler: async (ctx) => {
        const subCtx = { ...ctx, input: {} };

        await deleteNonActivatedUsersTask.handler(subCtx);
        await removeNonListMediaTask.handler(subCtx);
        await removeUnusedMediaCoversTask.handler(subCtx);
        await bulkMediaRefreshTask.handler(subCtx);
        await addMediaNotificationsTask.handler(subCtx);
        await lockOldMoviesTask.handler(subCtx);
        await computeAllUsersStatsTask.handler(subCtx);
        await calculateAchievementsTask.handler(subCtx);
        await dbMaintenanceTask.handler(subCtx);
        await addGenresToBooksUsingLlmTask.handler({ ...ctx, input: { batchLimit: 10, batchSize: 10 } });
    },
});
