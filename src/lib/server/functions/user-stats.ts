import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserStats = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const userStatsService = getContainer().services.userStats;

        // if (!mediaType) {
        const userStats = await userStatsService.userAdvancedStatsSummary(user.id);
        return { ...userStats, ratingSystem: user.ratingSystem };
        // }

        // if (user.userMediaSettings.find((s) => s.mediaType === mediaType)?.active === false) {
        //     throw new Error("MediaType not activated");
        // }
        //
        // return userStatsService.userMediaAdvancedStats(user.id, mediaType);
    });
