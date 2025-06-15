import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {RatingSystemType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getPlatformStats = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data: { mediaType } }) => {
        const userStatsService = getContainer().services.userStats;

        if (!mediaType) {
            const platformStats = await userStatsService.platformAdvancedStatsSummary();
            return { ...platformStats, ratingSystem: RatingSystemType.SCORE };
        }

        return userStatsService.platformMediaAdvancedStats(mediaType);
    });
