import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getComingNextMedia = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const mediaServiceRegistry = getContainer().registries.mediaService;

        const movieService = mediaServiceRegistry.getService(MediaType.MOVIES);
        const gamesService = mediaServiceRegistry.getService(MediaType.GAMES);

        return [
            await movieService.getComingNext(parseInt(currentUser.id!)),
            await gamesService.getComingNext(parseInt(currentUser.id!)),
        ];
    });
