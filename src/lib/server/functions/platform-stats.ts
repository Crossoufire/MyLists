import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {RatingSystemType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {platformStatsCacheMiddleware} from "@/lib/server/middlewares/caching";
import {platformStatsSchema} from "@/lib/types/zod.schema.types";


export const getPlatformStats = createServerFn({ method: "GET" })
    .middleware([authMiddleware, platformStatsCacheMiddleware])
    .validator(platformStatsSchema)
    .handler(async ({ data: { mediaType } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);

        if (!mediaType) {
            const platformStats = await userStatsService.platformAdvancedStatsSummary();
            return { ...platformStats, ratingSystem: RatingSystemType.SCORE, mediaType: undefined };
        }

        const mediaStats = await userStatsService.platformMediaAdvancedStats(mediaType);
        return { ...mediaStats, ratingSystem: RatingSystemType.SCORE, mediaType };
    });
