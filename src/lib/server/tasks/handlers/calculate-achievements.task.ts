import {z} from "zod";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const calculateAchievementsTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Calculate achievements and rarity for all users",
    },
    inputSchema: z.object({
        skipRarity: z.boolean().optional().describe("Skip rarity calculation"),
        mediaTypes: z.array(z.enum(MediaType)).optional().describe("Media types to calculate (all if omitted)"),
    }),
    handler: async (ctx) => {
        ctx.logger.info("Starting calculating all achievements...");

        const container = await getContainer();
        const mediaRegistry = container.registries.mediaService;
        const achievementsService = container.services.achievements;
        const allAchievements = await achievementsService.getAllAchievements();
        const typesToProcess = ctx.input.mediaTypes ?? Object.values(MediaType);

        for (const mediaType of typesToProcess) {
            const mediaService = mediaRegistry.getService(mediaType);
            const mediaAchievements = allAchievements.filter((ach) => ach.mediaType === mediaType);

            for (const achievement of mediaAchievements) {
                await achievementsService.calculateAchievement(achievement, mediaService);
            }

            ctx.logger.info({ mediaType }, "Achievements calculated");
        }

        if (!ctx.input.skipRarity) {
            await achievementsService.calculateAllAchievementsRarity();
            ctx.logger.info("Rarity calculation completed");
        }

        ctx.logger.info("Completed: CalculateAchievements execution.");
    },
});
