import {platformStatsSchema} from "@/lib/schemas";
import {createServerFn} from "@tanstack/react-start";
import {tryNotFound} from "@/lib/utils/try-not-found";
import {getContainer} from "@/lib/server/core/container";
import {AdvancedMediaStats} from "@/lib/types/stats.types";
import {MediaType, RatingSystemType} from "@/lib/utils/enums";
import {platformStatsCacheMiddleware} from "@/lib/server/middlewares/caching";
import {requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";


export const getPlatformStats = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware, platformStatsCacheMiddleware])
    .inputValidator(tryNotFound(platformStatsSchema))
    .handler(async ({ data: { mediaType } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);

        if (!mediaType) {
            const platformStats = await userStatsService.platformAdvancedStatsSummary();
            return {
                ...platformStats,
                mediaType: undefined,
                ratingSystem: RatingSystemType.SCORE,
                activatedMediaTypes: Object.values(MediaType),
            };
        }

        const mediaStats = await userStatsService.platformMediaAdvancedStats(mediaType);
        return {
            ...mediaStats,
            mediaType,
            ratingSystem: RatingSystemType.SCORE,
            activatedMediaTypes: Object.values(MediaType),
        } as AdvancedMediaStats;
    });
