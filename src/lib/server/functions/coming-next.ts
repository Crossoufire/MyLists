import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getComingNextMedia = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const container = await getContainer()

        const comingNextData = await Promise.all(
            Object.values(MediaType).map(mediaType => {
                const mediaService = container.registries.mediaService.getService(mediaType);
                if (typeof mediaService?.getComingNext === "function") {
                    return mediaService.getComingNext(parseInt(currentUser.id)).then(items => ({ items, mediaType }));
                }
                return null;
            }).filter(Boolean)
        );

        return comingNextData.filter(data => data !== null);
    });
