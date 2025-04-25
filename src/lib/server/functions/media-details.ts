import {container} from "@/lib/server/container";
import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getMediaDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any): { mediaType: MediaType, mediaId: number | string, external: boolean } => data)
    .handler(async ({ data: { mediaType, mediaId, external }, context: { currentUser } }) => {
        const userId = parseInt(currentUser.id);
        const mediaService = container.registries.mediaService.getService(mediaType);
        const mediaStrategy = container.registries.mediaStrategy.getStrategy(mediaType);

        const mediaDetails = await mediaService.getMediaDetails(mediaId, external, mediaStrategy);
        const userMediaDetails = await mediaService.getUserMediaDetails(userId, mediaDetails.id);
        const followsData = await mediaService.getUserFollowsMediaData(userId, mediaDetails.id);
        const similarMedia = await mediaService.findSimilarMedia(mediaDetails.id);

        return {
            media: mediaDetails,
            userMedia: userMediaDetails,
            followsData: followsData,
            similarMedia: similarMedia,
        };
    });
