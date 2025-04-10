import {container} from "@/lib/server/container";
import {createServerFn} from "@tanstack/react-start";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserStats = createServerFn({ method: "POST" })
    .middleware([authorizationMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const userStatsService = container.services.userStats;

        if (!mediaType) {
            return userStatsService.getUserMediaStats(user.id);
        }

        return userStatsService.getSpecificMediaTypeStats(user.id, mediaType);
    });
