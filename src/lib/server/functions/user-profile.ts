import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {allUpdatesHistorySchema} from "@/lib/types/zod.schema.types";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {authorizationMiddleware, headerMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserProfileHeader = createServerFn({ method: "GET" })
    .middleware([headerMiddleware])
    .handler(async ({ context: { currentUser, user } }) => {
        const container = await getContainer();
        const userService = container.services.user;

        const { followersCount, followsCount } = await userService.getFollowCount(user.id);
        const followStatus = currentUser && await userService.getFollowingStatus(currentUser.id, user.id);

        return {
            userData: {
                id: user.id,
                name: user.name,
                image: user.image,
                privacy: user.privacy,
                createdAt: user.createdAt,
                backgroundImage: user.backgroundImage,
                userMediaSettings: user.userMediaSettings.map(({ timeSpent, active }) => ({
                    timeSpent,
                    active,
                })),
            },
            social: {
                followsCount,
                followStatus,
                followersCount,
                followId: user.id,
            }
        };
    });


export const getUserProfile = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { currentUser, user } }) => {
        const targetUserId = user.id;
        const container = await getContainer();
        const userService = container.services.user;
        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const achievementsService = container.services.achievements;

        if (currentUser && currentUser.id !== targetUserId) {
            await userService.incrementProfileView(targetUserId);
        }

        const { followsCount } = await userService.getFollowCount(targetUserId);
        const userFollows = await userService.getUserFollows(undefined, targetUserId);
        const userUpdates = await userUpdatesService.getUserUpdates(targetUserId);
        const followsUpdates = await userUpdatesService.getFollowsUpdates(targetUserId, currentUser?.id);
        const preComputedStatsSummary = await userStatsService.userPreComputedStatsSummary(targetUserId);
        const perMediaSummary = await userStatsService.userPerMediaSummaryStats(targetUserId);
        const achievements = {
            summary: await achievementsService.getDifficultySummary(targetUserId),
            details: await achievementsService.getAchievementsDetails(targetUserId),
        };

        return {
            userUpdates,
            userFollows,
            achievements,
            followsCount,
            followsUpdates,
            perMediaSummary,
            mediaGlobalSummary: preComputedStatsSummary,
            userData: {
                id: user.id,
                name: user.name,
                image: user.image,
                privacy: user.privacy,
                createdAt: user.createdAt,
                ratingSystem: user.ratingSystem,
                backgroundImage: user.backgroundImage,
                userMediaSettings: user.userMediaSettings.map(({ mediaType, timeSpent, active }) => ({
                    active,
                    mediaType,
                    timeSpent,
                })),
            },
        };
    });


export const postUpdateShowOnboarding = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const container = await getContainer();
        const userService = container.services.user;
        await userService.updateShowOnboarding(currentUser.id);
    });


export const getUsersFollowers = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { user, currentUser } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.getUserFollowers(currentUser?.id, user.id, 999999);
    });


export const getUsersFollows = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { user, currentUser } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.getUserFollows(currentUser?.id, user.id, 999999);
    });


export const getAllUpdatesHistory = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .inputValidator(allUpdatesHistorySchema)
    .handler(async ({ data, context: { user } }) => {
        const userUpdatesService = await getContainer().then((c) => c.services.userUpdates);
        return userUpdatesService.getUserUpdatesPaginated(user.id, data);
    });
