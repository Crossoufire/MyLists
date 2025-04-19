import {container} from "@/lib/server/container";
import {createServerFn} from "@tanstack/react-start";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserStats = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const userStatsService = container.services.userStats;

        if (!mediaType) {
            return userStatsService.getUserMediaStats(user.id);
        }

        if (user.userMediaSettings.find((s) => s.mediaType === mediaType)?.active === false) {
            throw new Error("MediaType not activated");
        }

        return userStatsService.getSpecificMediaTypeStats(user.id, mediaType);
    });
