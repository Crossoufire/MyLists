import {container} from "@/lib/server/container";
import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getComingNextMedia = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const mediaServiceRegistry = container.registries.mediaService;
        const mediaService = mediaServiceRegistry.getService(MediaType.MOVIES);
        return [await mediaService.getComingNext(parseInt(currentUser.id!))];
    });
