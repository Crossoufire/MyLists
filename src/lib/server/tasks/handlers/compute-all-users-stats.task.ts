import {z} from "zod";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";
import {withTransaction} from "@/lib/server/database/async-storage";


export const computeAllUsersStatsTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Recompute pre-computed stats for all users",
    },
    inputSchema: z.object({}),
    handler: async (ctx) => {
        ctx.logger.info("Starting: ComputeAllUsersStats execution.");

        const container = await getContainer();
        const mediaTypes = Object.values(MediaType);
        const userStatsService = container.services.userStats;
        const mediaRegistry = container.registries.mediaService;

        for (const mediaType of mediaTypes) {
            ctx.logger.info(`Computing ${mediaType} stats for all users...`);

            const mediaService = mediaRegistry.getService(mediaType);

            await withTransaction(async () => {
                const userMediaStats = await mediaService.computeAllUsersStats();
                await userStatsService.updateAllUsersPreComputedStats(mediaType, userMediaStats);
            })

            ctx.logger.info(`Computed ${mediaType} stats for all users.`);
        }

        ctx.logger.info("Completed: ComputeAllUsersStats execution.");
    },
});
