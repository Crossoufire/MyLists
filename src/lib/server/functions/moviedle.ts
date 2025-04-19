import {container} from "@/lib/server/container";
import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getDailyMediadle = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const mediadleService = container.services.mediadle;
        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);

        // @ts-expect-error
        return mediadleService.getDailyMediadleData(currentUser.id, moviesService);
    });


export const getMediadleSuggestions = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any) => data as { query: string })
    .handler(async ({ data: { query } }) => {
        if (query.length < 2) {
            return [];
        }

        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);
        return moviesService.searchByName(query);
    });


export const postAddMediadleGuess = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator((data: any) => data as { guess: string })
    .handler(async ({ data: { guess }, context: { currentUser } }) => {
        const mediadleService = container.services.mediadle;
        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);

        try {
            // @ts-expect-error
            const result = await mediadleService.addMediadleGuess(currentUser.id, guess, moviesService);
            return result;
        } catch (error: any) {
            throw new Error(error.message);
        }
    });
