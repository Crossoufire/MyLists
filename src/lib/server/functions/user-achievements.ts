import {container} from "@/lib/server/container";
import {createServerFn} from "@tanstack/react-start";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserAchievements = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ context: { user } }) => {
        const achievementsService = container.services.achievements;

        const result = await achievementsService.getAllUserAchievements(user.id);
        const summary = await achievementsService.getUserAchievementStats(user.id);

        return { result, summary };
    });
