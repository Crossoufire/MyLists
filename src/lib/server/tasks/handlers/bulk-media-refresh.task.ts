import {z} from "zod";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const bulkMediaRefreshTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Bulk refresh media data from API providers",
    },
    inputSchema: z.object({
        limit: z.coerce.number().optional().describe("Maximum items to process per type"),
        mediaTypes: z.array(z.enum(MediaType)).optional().describe("Media types to refresh (all if omitted)"),
    }),
    handler: async (ctx) => {
        ctx.logger.info("Starting: bulkMediaRefresh execution.");

        const container = await getContainer();
        const registry = container.registries.mediaProviderService;
        const typesToProcess = ctx.input.mediaTypes ?? Object.values(MediaType);

        for (const mediaType of typesToProcess) {
            ctx.logger.info({ mediaType }, `Refreshing media for ${mediaType}...`);

            let processedCount = 0;
            const startTime = Date.now();
            const provider = registry.getService(mediaType);

            for await (const result of provider.bulkProcessAndRefreshMedia()) {
                processedCount += 1;
                if (ctx.input.limit && processedCount >= ctx.input.limit) break;

                if (result.state === "fulfilled") {
                    ctx.logger.info(`Refreshed ${mediaType} apiId: ${result.apiId}`);
                }
                else {
                    ctx.logger.error({ json: result.reason }, `Error refreshing ${mediaType} with apiId: ${result.apiId}`);
                }
            }

            const endTime = Date.now();
            const durationSecs = (endTime - startTime) / 1000;
            const rps = durationSecs > 0 ? processedCount / durationSecs : 0;

            ctx.logger.info(
                {
                    mediaType,
                    processedCount,
                    requestsPerSecond: rps.toFixed(2),
                    durationSeconds: durationSecs.toFixed(2),
                },
                `Refreshing ${mediaType} completed in ${durationSecs.toFixed(2)}s (req ${rps.toFixed(2)}/s)`
            );
        }

        ctx.logger.info("Completed: bulkMediaRefresh execution.");
    },
});
