import {container} from "@/lib/server/container";
import {createServerFn} from "@tanstack/react-start";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getHallOfFame = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data, context: { currentUser } }) => {
        const userStatsService = container.services.userStats;
        return userStatsService.getHallOfFameData(data, parseInt(currentUser.id!));
    });
