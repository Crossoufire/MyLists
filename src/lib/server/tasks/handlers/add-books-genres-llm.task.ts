import {z} from "zod";
import {serverEnv} from "@/env/server";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";
import {llmResponseSchema} from "@/lib/types/zod.schema.types";


export const addGenresToBooksUsingLlmTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Use LLM to assign genres to books without genres",
    },
    inputSchema: z.object({
        batchSize: z.coerce.number().min(1).max(10).default(10).describe("Number of books per batch"),
        batchLimit: z.coerce.number().min(1).max(50).default(10).describe("Maximum number of batches to process"),
    }),
    handler: async (ctx) => {
        ctx.logger.info("Starting: AddGenresToBooksUsingLLM execution.");
        ctx.logger.info(`Using: ${serverEnv.LLM_MODEL_ID}, from: ${serverEnv.LLM_BASE_URL}`);

        const container = await getContainer();
        const booksService = container.registries.mediaService.getService(MediaType.BOOKS);
        const booksProvider = container.registries.mediaProviderService.getService(MediaType.BOOKS);

        ctx.logger.info({ model: serverEnv.LLM_MODEL_ID, baseUrl: serverEnv.LLM_BASE_URL }, "LLM configuration");

        const booksGenres = booksService.getAvailableGenres();
        const batchedBooks = await booksService.batchBooksWithoutGenres(ctx.input.batchSize);

        ctx.logger.info({ batchCount: batchedBooks.length }, "Batches to process");

        const mainPrompt = `
You are given a list of books. Your task is to assign up to 4 relevant genres to each book from the provided genre list.
Genres to choose from:
${booksGenres.join(", ")}

Instructions:
1. Choose a MAXIMUM of 4 genres per book.
2. ONLY choose genres from the above list.
3. Output your answer as a JSON array following this schema:
   [
     {
       "bookApiId": string,
       "genres": string[]
     }
   ]

Make sure your response is **valid JSON** and strictly follows the schema.
`;

        for (const booksBatch of batchedBooks.slice(0, ctx.input.batchLimit)) {
            const promptToSend = `${mainPrompt}\n${booksBatch.join("\n")}`;

            try {
                const data = await booksProvider.llmResponse(promptToSend, llmResponseSchema);
                const result = llmResponseSchema.parse(JSON.parse(data.choices[0].message.content ?? ""));

                for (const item of result) {
                    const validGenres = item.genres.filter((g) => booksGenres.includes(g)).slice(0, 4);

                    if (!item.bookApiId || validGenres.length === 0) {
                        ctx.logger.warn({ item }, "Skipping invalid entry");
                        continue;
                    }

                    await booksService.addGenresToBook(item.bookApiId, validGenres);
                    ctx.logger.info({ bookApiId: item.bookApiId, genres: validGenres }, "Added genres");
                }
            }
            catch (err) {
                ctx.logger.error({ err }, "Error while applying genres");
            }
        }

        ctx.logger.info("Finished AddGenresToBooksUsingLLM execution.");
    },
});
