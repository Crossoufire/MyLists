import {createServerFn} from "@tanstack/react-start";
import {tryNotFound} from "@/lib/utils/try-not-found";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/utils/error-classes";
import {AdvancedMediaStats} from "@/lib/types/stats.types";
import {privateAuthZMiddleware} from "@/lib/server/middlewares/authorization";
import {getMonthlyActivitySchema, getSectionActivitySchema, getUserStatsSchema} from "@/lib/types/zod.schema.types";


export const getUserStats = createServerFn({ method: "GET" })
    .middleware([privateAuthZMiddleware])
    .inputValidator(tryNotFound(getUserStatsSchema))
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


export const getMonthlyActivity = createServerFn({ method: "GET" })
    .middleware([privateAuthZMiddleware])
    .inputValidator(tryNotFound(getMonthlyActivitySchema))
    .handler(async ({ data: { year, month }, context: { user } }) => {
        const container = await getContainer();
        const userStatsService = container.services.userStats;

        const start = new Date(Date.UTC(year, month - 1, 0, 23, 59, 59));
        const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

        return userStatsService.getMonthlyActivity(user.id, start, end);
    });


export const getSectionActivity = createServerFn({ method: "GET" })
    .middleware([privateAuthZMiddleware])
    .inputValidator(tryNotFound(getSectionActivitySchema))
    .handler(async ({ data, context: { user } }) => {
        const container = await getContainer();
        const userStatsService = container.services.userStats;

        return userStatsService.getSectionActivity(user.id, data);
    });
