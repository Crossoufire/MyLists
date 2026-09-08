import {createServerFn} from "@tanstack/react-start";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";


const COMING_NEXT_MEDIA_TYPES: readonly MediaType[] = [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES, MediaType.GAMES];


export const getComingNextMedia = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const container = await getContainer()
        const settings = await container.services.account.getMinimalUserSettings(currentUser.id);
        const activeMediaTypes = new Set(settings.filter(({ active }) => active).map(({ mediaType }) => mediaType));
        const mediaTypes = COMING_NEXT_MEDIA_TYPES.filter((mediaType) => activeMediaTypes.has(mediaType));

        const comingNextData = await Promise.all(
            mediaTypes.map(async (mediaType) => {
                const mediaService = container.registries.mediaService.get(mediaType);
                const items = await mediaService.getUpcomingMedia(currentUser.id);
                return ({ items, mediaType });
            })
        );

        return comingNextData;
    });
