import {z} from "zod";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";
import {withTransaction} from "@/lib/server/database/async-storage";


export const seedAchievementsTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Seed achievement definitions for all media types",
    },
    inputSchema: z.object({}),
    handler: async (ctx) => {
        const container = await getContainer();
        const mediaTypes = Object.values(MediaType);
        const mediaRegistry = container.registries.mediaService;
        const achievementsService = container.services.achievements;

        ctx.logger.info("Starting seeding achievements...");

        for (const mediaType of mediaTypes) {
            ctx.logger.info(`Seeding ${mediaType} achievements...`);

            const mediaService = mediaRegistry.getService(mediaType);
            const achievementsDefinition = mediaService.getAchievementsDefinition();

            await withTransaction(async () => {
                await achievementsService.seedAchievements(achievementsDefinition);
            });

            ctx.logger.info(`Seeding ${mediaType} achievements completed.`);
        }

        ctx.logger.info("Completed: SeedAchievements execution.");
    },
});
