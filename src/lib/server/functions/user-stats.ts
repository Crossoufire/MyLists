import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {tryNotFound} from "@/lib/server/utils/try-not-found";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";
import {getUserStatsSchema} from "@/lib/types/zod.schema.types";


export const getUserStats = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator(data => tryNotFound(() => getUserStatsSchema.parse(data)))
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
        };
    });
