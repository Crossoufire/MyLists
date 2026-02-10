import {zeroPad} from "@/lib/utils/formating";
import {createServerFn} from "@tanstack/react-start";
import {tryNotFound} from "@/lib/utils/try-not-found";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/utils/error-classes";
import {AdvancedMediaStats} from "@/lib/types/stats.types";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";
import {
    deleteActivitySchema,
    getSectionActivitySchema,
    getSpecificActivitySchema,
    getUserStatsSchema,
    monthlyActivitySchema,
    updateActivitySchema
} from "@/lib/types/zod.schema.types";


export const getUserStats = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
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
    .middleware([authorizationMiddleware])
    .inputValidator(tryNotFound(monthlyActivitySchema))
    .handler(async ({ data: { year, month }, context: { user } }) => {
        const container = await getContainer();

        const timeBucket = `${year}-${zeroPad(month)}`;
        const userStatsService = container.services.userStats;

        return userStatsService.getMonthlyActivity(user.id, timeBucket);
    });


export const getSectionActivity = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .inputValidator(tryNotFound(getSectionActivitySchema))
    .handler(async ({ data, context: { user } }) => {
        const container = await getContainer();
        const userStatsService = container.services.userStats;

        return userStatsService.getSectionActivity(user.id, data);
    });


export const getSpecificActivity = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .inputValidator(tryNotFound(getSpecificActivitySchema))
    .handler(async ({ data: { year, month, mediaType, mediaId }, context: { user } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        return userStatsService.getSpecificActivity(user.id, { year, month, mediaType, mediaId });
    });


export const postUpdateSpecificActivity = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .inputValidator(updateActivitySchema)
    .handler(async ({ data: { activityId, payload }, context: { currentUser } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        return userStatsService.updateSpecificActivity(currentUser.id, activityId, payload);
    });


export const postDeleteSpecificActivity = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .inputValidator(deleteActivitySchema)
    .handler(async ({ data: { activityId }, context: { currentUser } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        await userStatsService.deleteSpecificActivity(currentUser.id, activityId);
    });
