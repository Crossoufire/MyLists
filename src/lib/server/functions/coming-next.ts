import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getComingNextMedia = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const mediaServiceRegistry = getContainer().registries.mediaService;
        const mediaService = mediaServiceRegistry.getService(MediaType.MOVIES);
        return [await mediaService.getComingNext(parseInt(currentUser.id!))];
    });
