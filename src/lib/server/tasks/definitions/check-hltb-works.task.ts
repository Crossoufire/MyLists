import {z} from "zod";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const checkHltbWorksTask = defineTask({
    name: "check-hltb-works" as const,
    visibility: "admin",
    description: "Verify HLTB API integration is working",
    inputSchema: z.object({}),
    handler: async (ctx) => {
        const container = await getContainer();
        const gamesProvider = container.registries.mediaProviderService.getService(MediaType.GAMES);

        await ctx.step(`verify-hltb-search`, async () => {
            const hltbData = await gamesProvider.checkHLTBWorks("Halo 3");

            ctx.metric("game_name", hltbData.name);
            ctx.metric("story", hltbData.mainStory ?? "null");
            ctx.metric("extra", hltbData.mainExtra ?? "null");
            ctx.metric("completionist", hltbData.completionist ?? "null");

            if (hltbData.mainStory === null && hltbData.mainExtra === null && hltbData.completionist === null) {
                ctx.error("HLTB API returned all metrics as null. API has changed.", { payload: hltbData });
                throw new Error("API health check failed: Missing duration metrics.");
            }

            ctx.info("HLTB Integration is healthy.");
        });
    },
});
