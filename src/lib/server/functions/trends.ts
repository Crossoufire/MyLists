import {MediaType} from "@/lib/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {trendsCacheMiddleware} from "@/lib/server/middlewares/caching";


export const getTrendsMedia = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware, trendsCacheMiddleware])
    .handler(async () => {
        const container = await getContainer();

        const seriesProviderService = container.registries.mediaProviderService.getService(MediaType.SERIES);
        const seriesTrends = await seriesProviderService.fetchAndFormatTrends();

        const moviesProviderService = container.registries.mediaProviderService.getService(MediaType.MOVIES);
        const moviesTrends = await moviesProviderService.fetchAndFormatTrends();

        return { seriesTrends, moviesTrends };
    });
