import {notFound} from "@tanstack/react-router";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {NotificationType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserProfile = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { currentUser, user } }) => {
        const profileOwnerId = user.id;
        const userService = getContainer().services.user;
        const userStatsService = getContainer().services.userStats;
        const userUpdatesService = getContainer().services.userUpdates;
        const achievementsService = getContainer().services.achievements;

        // @ts-expect-error
        if (currentUser && currentUser.id !== profileOwnerId) {
            await userService.incrementProfileView(profileOwnerId);
        }

        const userFollows = await userService.getUserFollows(profileOwnerId);
        const userUpdates = await userUpdatesService.getUserUpdates(profileOwnerId);
        const followsUpdates = await userUpdatesService.getFollowsUpdates(profileOwnerId, !currentUser);
        // @ts-expect-error
        const isFollowing = currentUser ? await userService.isFollowing(currentUser.id, profileOwnerId) : false;
        const mediaGlobalSummary = await userStatsService.getGlobalStats(profileOwnerId);
        const perMediaSummary = await userStatsService.getSummaryStats(profileOwnerId);
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
            mediaGlobalSummary,
            perMediaSummary,
            achievements,
        };
    });


export const postUpdateFollowStatus = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator((data: any) => data as { followId: number, followStatus: boolean })
    .handler(async ({ data: { followId, followStatus }, context: { currentUser } }) => {
        const userService = getContainer().services.user;
        const notificationsService = getContainer().services.notifications;

        // @ts-expect-error
        if (currentUser.id === followId) {
            throw new Error("You cannot follow yourself ;)");
        }

        const targetUser = await userService.getUserById(followId);
        if (!targetUser) {
            throw notFound();
        }

        // @ts-expect-error
        await userService.updateFollowStatus(currentUser.id, targetUser.id);

        if (followStatus) {
            const payload = { username: currentUser.name, message: `${currentUser.name} is following you` }
            //@ts-expect-error
            notificationsService.sendNotification(currentUser.id, NotificationType.FOLLOW, payload);
        }
    });


export const getUsersFollowers = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { user } }) => {
        const userService = getContainer().services.user;
        return userService.getUserFollowers(user.id, 999999);
    });


export const getUsersFollows = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { user } }) => {
        const userService = getContainer().services.user;
        return userService.getUserFollows(user.id, 999999);
    });


export const getAllUpdatesHistory = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator((data: any) => data)
    .handler(async ({ context: { user }, data }) => {
        const userUpdatesService = getContainer().services.userUpdates;
        return userUpdatesService.getUserUpdatesPaginated(user.id, { ...data.filters });
    });
