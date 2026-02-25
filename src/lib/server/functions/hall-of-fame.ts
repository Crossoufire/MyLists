import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {searchTypeSchema} from "@/lib/types/zod.schema.types";
import {requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";


export const getHallOfFame = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware])
    .inputValidator(searchTypeSchema)
    .handler(async ({ data, context: { currentUser } }) => {
        const userStatsService = await getContainer().then((c) => c.services.userStats);
        return userStatsService.userHallofFameData(currentUser.id, data);
    });
