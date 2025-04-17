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
