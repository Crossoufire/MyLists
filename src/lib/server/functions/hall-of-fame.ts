import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {searchTypeHoFSchema} from "@/lib/server/types/base.types";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getHallOfFame = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: unknown) => searchTypeHoFSchema.parse(data))
    .handler(async ({ data, context: { currentUser } }) => {
        const userStatsService = await getContainer().then((c) => c.services.userStats);
        return userStatsService.userHallofFameData(currentUser.id, data);
    });
