import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {getUserStatsSchema} from "@/lib/server/types/base.types";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserStats = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator(data => getUserStatsSchema.parse(data))
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        const activatedMediaTypes = user.userMediaSettings.filter((s) => s.active === true).map((s) => s.mediaType)

        if (!mediaType) {
            const userStats = await userStatsService.userAdvancedStatsSummary(user.id);
            return {
                ...userStats,
                ratingSystem: user.ratingSystem,
                mediaType: undefined,
                activatedMediaTypes,
            };
        }

        if (user.userMediaSettings.find((s) => s.mediaType === mediaType)?.active === false) {
            throw new FormattedError("MediaType not activated");
        }

        const mediaStats = await userStatsService.userMediaAdvancedStats(user.id, mediaType);
        return {
            ...mediaStats,
            ratingSystem: user.ratingSystem,
            mediaType,
            activatedMediaTypes,
        };
    });
