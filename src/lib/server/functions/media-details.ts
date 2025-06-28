import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {JobType, MediaType} from "@/lib/server/utils/enums";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {authMiddleware, managerAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {SearchType} from "@/lib/server/types/base.types";


export const getMediaDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any): { mediaType: MediaType, mediaId: number | string, external: boolean } => data)
    .handler(async ({ data: { mediaType, mediaId, external }, context: { currentUser } }) => {
        const mediaService = getContainer().registries.mediaService.getService(mediaType);
        const mediaProviderService = getContainer().registries.mediaProviderService.getService(mediaType);

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
        const mediaProviderService = getContainer().registries.mediaProviderService.getService(mediaType);
        await mediaProviderService.fetchAndRefreshMediaDetails(apiId);
    });


export const getMediaDetailsToEdit = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, transactionMiddleware])
    .validator((data: any) => data as { mediaType: MediaType, mediaId: number })
    .handler(async ({ data: { mediaType, mediaId } }) => {
        const mediaService = getContainer().registries.mediaService.getService(mediaType);
        return mediaService.getMediaEditableFields(mediaId);
    });


export const postEditMediaDetails = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, transactionMiddleware])
    .validator((data: any) => data as {
        mediaId: number,
        mediaType: MediaType,
        payload: Record<string, any>,
    })
    .handler(async ({ data: { mediaType, mediaId, payload } }) => {
        const mediaService = getContainer().registries.mediaService.getService(mediaType);
        return mediaService.updateMediaEditableFields(mediaId, payload);
    });


export const getJobDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data) => data as {
        name: string,
        job: JobType,
        mediaType: MediaType,
        search: SearchType,
    })
    .handler(async ({ data: { mediaType, job, name, search }, context: { currentUser } }) => {
        const mediaService = getContainer().registries.mediaService.getService(mediaType);
        return mediaService.getMediaJobDetails(parseInt(currentUser.id), job, name, search);
    });
