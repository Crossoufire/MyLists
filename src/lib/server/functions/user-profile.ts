import {notFound} from "@tanstack/react-router";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {NotificationType} from "@/lib/server/utils/enums";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";
import {allUpdatesHistorySchema, updateFollowStatusSchema} from "@/lib/server/types/base.types";


export const getUserProfile = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { currentUser, user } }) => {
        const profileOwnerId = user.id;
        const container = await getContainer();
        const userService = container.services.user;
        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const achievementsService = container.services.achievements;

        if (currentUser && currentUser.id !== profileOwnerId) {
            await userService.incrementProfileView(profileOwnerId);
        }

        const userFollows = await userService.getUserFollows(profileOwnerId);
        const userUpdates = await userUpdatesService.getUserUpdates(profileOwnerId);
        const followsUpdates = await userUpdatesService.getFollowsUpdates(profileOwnerId, !currentUser);
        const isFollowing = currentUser ? await userService.isFollowing(currentUser.id, profileOwnerId) : false;
        const preComputedStatsSummary = await userStatsService.userPreComputedStatsSummary(profileOwnerId);
        const perMediaSummary = await userStatsService.userPerMediaSummaryStats(profileOwnerId);
        const achievements = {
            summary: await achievementsService.getDifficultySummary(profileOwnerId),
            details: await achievementsService.getAchievementsDetails(profileOwnerId),
        };

        return {
            userData: user,
            userUpdates,
            userFollows,
            followsUpdates,
            isFollowing,
            mediaGlobalSummary: preComputedStatsSummary,
            perMediaSummary,
            achievements,
        };
    });


export const postUpdateFollowStatus = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(updateFollowStatusSchema)
    .handler(async ({ data: { followId, followStatus }, context: { currentUser } }) => {
        const container = await getContainer();
        const userService = container.services.user;
        const notificationsService = container.services.notifications;

        if (currentUser.id === followId) {
            throw new FormattedError("You cannot follow yourself ;)");
        }

        const targetUser = await userService.getUserById(followId);
        if (!targetUser) {
            throw notFound();
        }

        await userService.updateFollowStatus(currentUser.id, targetUser.id);

        if (followStatus) {
            const payload = { username: currentUser.name, message: `${currentUser.name} is following you` }
            await notificationsService.sendNotification(currentUser.id, NotificationType.FOLLOW, payload);
        }
    });


export const getUsersFollowers = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { user } }) => {
        const userService = await getContainer().then(c => c.services.user);
        return userService.getUserFollowers(user.id, 999999);
    });


export const getUsersFollows = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { user } }) => {
        const userService = await getContainer().then(c => c.services.user);
        return userService.getUserFollows(user.id, 999999);
    });


export const getAllUpdatesHistory = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator(allUpdatesHistorySchema)
    .handler(async ({ data, context: { user } }) => {
        const userUpdatesService = await getContainer().then(c => c.services.userUpdates);
        return userUpdatesService.getUserUpdatesPaginated(user.id, data);
    });
