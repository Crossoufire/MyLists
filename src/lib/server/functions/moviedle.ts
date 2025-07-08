import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {addMediadleGuessSchema, mediadleSuggestionsSchema} from "@/lib/server/types/base.types";


export const getDailyMediadle = createServerFn({ method: "GET" })
    .middleware([authMiddleware, transactionMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const container = await getContainer();
        const mediadleService = container.services.mediadle;
        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);
        return mediadleService.getDailyMediadleData(parseInt(currentUser.id), moviesService);
    });


export const getMediadleSuggestions = createServerFn({ method: "GET" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator(data => mediadleSuggestionsSchema.parse(data))
    .handler(async ({ data: { query } }) => {
        if (query.length < 2) return [];

        const container = await getContainer();
        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);
        return moviesService.searchByName(query);
    });


export const postAddMediadleGuess = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator(data => addMediadleGuessSchema.parse(data))
    .handler(async ({ data: { guess }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediadleService = container.services.mediadle;
        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);

        // @ts-expect-error
        return mediadleService.addMediadleGuess(currentUser.id, guess, moviesService);
    });
