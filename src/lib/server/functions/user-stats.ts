import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {getUserStatsSchema} from "@/lib/server/types/base.types";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserStats = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator(data => getUserStatsSchema.parse(data))
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);

        // if (!mediaType) {
        const userStats = await userStatsService.userAdvancedStatsSummary(user.id);
        return { ...userStats, ratingSystem: user.ratingSystem };
        // }

        // if (user.userMediaSettings.find((s) => s.mediaType === mediaType)?.active === false) {
        //     throw new FormattedError("MediaType not activated");
        // }
        //
        // return userStatsService.userMediaAdvancedStats(user.id, mediaType);
    });
