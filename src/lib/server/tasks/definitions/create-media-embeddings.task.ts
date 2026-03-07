import {z} from "zod";
import {serverEnv} from "@/env/server";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


const BATCH_SIZE = 500;


export const createMediaEmbeddingsTask = defineTask({
    name: "create-media-embeddings" as const,
    visibility: "admin",
    description: "Create missing embeddings and optionally refresh recently updated media embeddings",
    inputSchema: z.object({
        mediaTypes: z.array(z.enum(MediaType)).optional().describe("Media types to process (default: all)"),
        refreshRecentlyUpdated: z.coerce.boolean().optional().describe("If true, also refresh items updated in the last 7 days"),
    }),
    handler: async (ctx, input) => {
        const container = await getContainer();
        const llmClient = container.clients.llmClient;
        const mediaTypes = input.mediaTypes ?? Object.values(MediaType);
        const refreshRecentlyUpdated = input.refreshRecentlyUpdated ?? false;

        ctx.metric("embedding.batchSize", BATCH_SIZE);
        ctx.metric("llm.model", serverEnv.LLM_EMBED_MODEL_ID);
        ctx.metric("embedding.refreshRecentlyUpdated", String(refreshRecentlyUpdated));

        for (const mediaType of mediaTypes) {
            await ctx.step(`process-${mediaType}`, async () => {
                const mediaService = container.registries.mediaService.getService(mediaType);
                const mediaToEmbed = await mediaService.getMediaToEmbed(refreshRecentlyUpdated);

                ctx.metric(`${mediaType}.mediaToEmbed`, mediaToEmbed.length);

                if (mediaToEmbed.length === 0) return;

                for (let i = 0; i < mediaToEmbed.length; i += BATCH_SIZE) {
                    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
                    const currentBatch = mediaToEmbed.slice(i, i + BATCH_SIZE);

                    await ctx.step(`${mediaType}-batch-${batchIndex}`, async () => {
                        try {
                            const response = await llmClient.llmEmbeddingCall(currentBatch.map(item => item.embeddingInput));

                            const rawEmbeddings = response.data.sort((a, b) => a.index - b.index);
                            if (rawEmbeddings.length !== currentBatch.length) {
                                throw new Error(`Length mismatch: expected ${currentBatch.length}, got ${rawEmbeddings.length}`);
                            }

                            const updates = currentBatch.map((item, idx) => ({
                                mediaId: item.mediaId,
                                vector: rawEmbeddings[idx].embedding,
                            }));

                            await mediaService.upsertEmbeddingVectors(updates);

                            ctx.increment(`${mediaType}.embedded`, updates.length);
                        }
                        catch (err) {
                            ctx.error(`Failed to process ${mediaType} batch ${batchIndex}`, {
                                error: err instanceof Error ? err.message : String(err)
                            });
                            throw err;
                        }
                    });
                }
            });
        }
    },
});
