import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {RatingSystemType} from "@/lib/utils/enums";
import {platformStatsSchema} from "@/lib/types/zod.schema.types";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {platformStatsCacheMiddleware} from "@/lib/server/middlewares/caching";


export const getPlatformStats = createServerFn({ method: "GET" })
    .middleware([authMiddleware, platformStatsCacheMiddleware])
    .inputValidator(platformStatsSchema)
    .handler(async ({ data: { mediaType } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);

        if (!mediaType) {
            const platformStats = await userStatsService.platformAdvancedStatsSummary();
            return { ...platformStats, ratingSystem: RatingSystemType.SCORE, mediaType: undefined };
        }

        const mediaStats = await userStatsService.platformMediaAdvancedStats(mediaType);
        return { ...mediaStats, ratingSystem: RatingSystemType.SCORE, mediaType };
    });
