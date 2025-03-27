import { container } from "@/lib/server/container";
import { createServerFn } from "@tanstack/react-start";
import { authorizationMiddleware } from "@/lib/server/middlewares/authorization";
import { UserUpdatesService } from "@/lib/server/services/user/user-updates.service";


export const getUserProfile = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { currentUser, user, userService } }) => {
        const userId = user.id.toString();
        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;

        if (currentUser && currentUser.id !== userId) {
            await userService.incrementProfileView(userId);
        }

        const userFollows = await userService.getUserFollows(userId);
        const userUpdates = await userUpdatesService.getUserUpdates(userId);
        const followsUpdates = await userUpdatesService.getFollowsUpdates(userId);
        const isFollowing = currentUser ? "check_using_a_function_here()" : false;
        const mediaGlobalSummary = await userStatsService.getGlobalStats(userId);
        const perMediaSummary = await userStatsService.getSummaryStats(userId);

        const data = {
            userData: user,
            userUpdates,
            userFollows,
            followsUpdates,
            isFollowing,
            mediaGlobalSummary,
            perMediaSummary,
            achievements: [],
        }

        return data;
    });
