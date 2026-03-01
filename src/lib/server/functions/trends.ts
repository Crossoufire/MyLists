import {MediaType} from "@/lib/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {trendsCacheMiddleware} from "@/lib/server/middlewares/caching";
import {requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";


export const getTrendsMedia = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware, trendsCacheMiddleware])
    .handler(async () => {
        const container = await getContainer();
        const mediaProviderRegistry = container.registries.mediaProviderService;
        const gamesProviderService = mediaProviderRegistry.getService(MediaType.GAMES);
        const seriesProviderService = mediaProviderRegistry.getService(MediaType.SERIES);
        const moviesProviderService = mediaProviderRegistry.getService(MediaType.MOVIES);

        const gamesTrends = await gamesProviderService.fetchAndFormatTrends();
        const seriesTrends = await seriesProviderService.fetchAndFormatTrends();
        const moviesTrends = await moviesProviderService.fetchAndFormatTrends();

        return { seriesTrends, moviesTrends, gamesTrends };
    });
