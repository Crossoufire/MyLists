import {container} from "@/lib/server/container";
import {createServerFn} from "@tanstack/react-start";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserProfile = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { currentUser, user }, data }) => {
        const profileOwnerId = user.id;
        const toto = data;
        const userService = container.services.user;
        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const achievementsService = container.services.achievements;

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
