import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {plaftformStatsSchema} from "@/lib/server/types/base.types";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getPlatformStats = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(data => plaftformStatsSchema.parse(data))
    .handler(async ({ data: { mediaType } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);

        if (!mediaType) {
            return userStatsService.platformAdvancedStatsSummary();
        }

        return userStatsService.platformMediaAdvancedStats(mediaType);
    });
