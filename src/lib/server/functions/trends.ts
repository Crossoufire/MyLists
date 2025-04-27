import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {trendsCacheMiddleware} from "@/lib/server/middlewares/caching";


export const getTrendsMedia = createServerFn({ method: "GET" })
    .middleware([authMiddleware, trendsCacheMiddleware])
    .handler(async () => {
        const mediaProviderService = getContainer().registries.mediaProviderService.getService(MediaType.MOVIES);
        const moviesTrends = await mediaProviderService.fetchAndFormatTrends();

        return { moviesTrends };
    });
