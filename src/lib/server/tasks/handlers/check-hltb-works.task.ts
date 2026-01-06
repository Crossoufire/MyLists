import {z} from "zod";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const checkHltbWorksTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Verify HLTB (HowLongToBeat) API integration is working",
    },
    inputSchema: z.object({
        gameName: z.string().default("Halo 3").describe("Game name to test HLTB lookup"),
    }),
    handler: async (ctx) => {
        ctx.logger.info("Starting: checkHLTBWorks execution.");

        const container = await getContainer();
        const gamesProvider = container.registries.mediaProviderService.getService(MediaType.GAMES);

        const hltbData = await gamesProvider.checkHLTBWorks(ctx.input.gameName);

        ctx.logger.info({ json: hltbData }, `${ctx.input.gameName} HLTB data`);
        ctx.logger.info("Completed: checkHLTBWorks execution.");
    },
});
