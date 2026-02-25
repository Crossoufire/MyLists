import {MediaType} from "@/lib/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {addMediadleGuessSchema, mediadleSuggestionsSchema} from "@/lib/types/zod.schema.types";


export const getDailyMediadle = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const container = await getContainer();
        const mediadleService = container.services.mediadle;
        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);

        return mediadleService.getDailyMediadleData(currentUser.id, moviesService);
    });


export const getMediadleSuggestions = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(mediadleSuggestionsSchema)
    .handler(async ({ data: { query } }) => {
        if (query.length < 2) return [];

        const container = await getContainer();
        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);
        return moviesService.searchByName(query);
    });


export const postAddMediadleGuess = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(addMediadleGuessSchema)
    .handler(async ({ data: { guess }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediadleService = container.services.mediadle;
        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);
        return mediadleService.addMediadleGuess(currentUser.id, guess, moviesService);
    });
