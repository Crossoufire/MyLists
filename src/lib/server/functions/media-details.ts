import {container} from "@/lib/server/container";
import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {authMiddleware, managerAuthMiddleware} from "@/lib/server/middlewares/authentication";


export const getMediaDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any): { mediaType: MediaType, mediaId: number | string, external: boolean } => data)
    .handler(async ({ data: { mediaType, mediaId, external }, context: { currentUser } }) => {
        const mediaService = container.registries.mediaService.getService(mediaType);
        const mediaProviderService = container.registries.mediaProviderService.getService(mediaType);

        const {
            media,
            userMedia,
            followsData,
            similarMedia,
        } = await mediaService.getMediaAndUserDetails(parseInt(currentUser.id), mediaId, external, mediaProviderService);

        return { media, userMedia, followsData, similarMedia };
    });


export const refreshMediaDetails = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, transactionMiddleware])
    .validator((data: any) => data as { mediaType: MediaType, apiId: number })
    .handler(async ({ data: { mediaType, apiId } }) => {
        const mediaProviderService = container.registries.mediaProviderService.getService(mediaType);
        await mediaProviderService.processAndRefreshMedia(apiId);
    });
