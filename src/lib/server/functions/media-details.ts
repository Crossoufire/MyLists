import {container} from "@/lib/server/container";
import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getMediaDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any): { mediaType: MediaType, mediaId: number | string, external: boolean } => data)
    .handler(async ({ data: { mediaType, mediaId, external }, context: { currentUser } }) => {
        //@ts-expect-error
        const mediaStrategy = container.registries.mediaStrategy.getStrategy(mediaType);
        //@ts-expect-error
        const mediaService = container.registries.mediaService.getService(mediaType);

        //@ts-expect-error
        const mediaDetails = await mediaService.getMediaDetails(mediaId, external, mediaStrategy);
        //@ts-expect-error
        const userMediaDetails = await mediaService.getUserMediaDetails(currentUser.id, mediaDetails.id);
        //@ts-expect-error
        const followsData = await mediaService.getUserFollowsMediaData(currentUser.id, mediaDetails.id);
        const similarMedia = await mediaService.findSimilarMedia(mediaDetails.id);

        const data = {
            media: mediaDetails,
            userMedia: userMediaDetails,
            followsData: followsData,
            similarMedia: similarMedia,
        };

        return data;
    });
