import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getHallOfFame = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data, context: { currentUser } }) => {
        const userStatsService = getContainer().services.userStats;
        return userStatsService.getHallOfFameData(data, parseInt(currentUser.id!));
    });
