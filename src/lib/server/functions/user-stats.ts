import {createServerFn} from "@tanstack/react-start";
import {tryNotFound} from "@/lib/utils/try-not-found";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/utils/error-classes";
import {AdvancedMediaStats} from "@/lib/types/stats.types";
import {getUserStatsSchema} from "@/lib/types/zod.schema.types";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserStats = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .inputValidator((data) => tryNotFound(() => getUserStatsSchema.parse(data)))
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        const activatedMediaTypes = user.userMediaSettings.filter((s) => s.active).map((s) => s.mediaType)

        if (!mediaType) {
            const userStats = await userStatsService.userAdvancedSummaryStats(user.id);
            return {
                ...userStats,
                activatedMediaTypes,
                mediaType: undefined,
                ratingSystem: user.ratingSystem,
            };
        }

        if (user.userMediaSettings.find((s) => s.mediaType === mediaType)?.active === false) {
            throw new FormattedError("MediaType not activated");
        }

        const mediaStats = await userStatsService.userAdvancedMediaStats(user.id, mediaType);
        return {
            ...mediaStats,
            mediaType,
            activatedMediaTypes,
            ratingSystem: user.ratingSystem,
        } as AdvancedMediaStats;
    });
