import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getComingNextMedia = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const mediaServiceRegistry = getContainer().registries.mediaService;

        const comingNextData = [];
        for (const mediaType of Object.values(MediaType)) {
            const service = mediaServiceRegistry.getService(mediaType);
            if (typeof service?.getComingNext === "function") {
                const items = await service.getComingNext(parseInt(currentUser.id!));
                comingNextData.push({ items, mediaType });
            }
        }

        return comingNextData;
    });
