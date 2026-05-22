import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {tryFormZodError, tryNotFound} from "@/lib/utils/try-not-found";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {privateAuthZMiddleware} from "@/lib/server/middlewares/authorization";
import {requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {
    activityAddMediaSearchSchema,
    addActivitySchema,
    bulkHideActivitySchema,
    deleteActivitySchema,
    getSpecificActivitySchema,
    monthlyActivitySchema,
    monthlyActivityStatsSchema,
    updateActivitySchema
} from "@/lib/schemas";


export const getMonthlyActivityStats = createServerFn({ method: "GET" })
    .middleware([privateAuthZMiddleware])
    .inputValidator(tryNotFound(monthlyActivityStatsSchema))
    .handler(async ({ data, context: { user } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        return userStatsService.getMonthlyActivityStats(user.id, data);
    });


export const getMonthlyActivity = createServerFn({ method: "GET" })
    .middleware([privateAuthZMiddleware])
    .inputValidator(tryNotFound(monthlyActivitySchema))
    .handler(async ({ data, context: { user } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        return userStatsService.getMonthlyActivity(user.id, data);
    });


export const getSpecificActivity = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware])
    .inputValidator(tryNotFound(getSpecificActivitySchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        return userStatsService.getSpecificActivity(currentUser.id, data);
    });


export const getActivityAddMediaSearch = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware])
    .inputValidator(tryNotFound(activityAddMediaSearchSchema))
    .handler(async ({ data: { mediaType, query }, context: { currentUser } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        return userStatsService.searchActivityUserMedia(currentUser.id, mediaType, query);
    });


export const postUpdateSpecificActivity = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(updateActivitySchema))
    .handler(async ({ data: { activityId, payload }, context: { currentUser } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        return userStatsService.updateSpecificActivity(currentUser.id, activityId, payload);
    });


export const postAddSpecificActivity = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(addActivitySchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        await userStatsService.addManualActivity(currentUser.id, data);
    });


export const postDeleteSpecificActivity = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(deleteActivitySchema)
    .handler(async ({ data: { activityId }, context: { currentUser } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        await userStatsService.deleteSpecificActivity(currentUser.id, activityId);
    });


export const postBulkHideActivity = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(bulkHideActivitySchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        return userStatsService.bulkHideActivity(currentUser.id, data);
    });
