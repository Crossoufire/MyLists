import {MediaType} from "@/lib/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getComingNextMedia = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const container = await getContainer()

        const mediaTypes = [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES, MediaType.GAMES]
        const comingNextData = await Promise.all(
            mediaTypes.map(async (mediaType) => {
                const mediaService = container.registries.mediaService.getService(mediaType);
                const items = await mediaService.getUpcomingMedia(currentUser.id);
                return ({ items, mediaType });
            })
        );

        return comingNextData;
    });
