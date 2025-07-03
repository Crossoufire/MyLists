import {createServerFn} from "@tanstack/react-start";
import {SearchType} from "@/lib/server/types/base.types";
import {getContainer} from "@/lib/server/core/container";
import {JobType, MediaType} from "@/lib/server/utils/enums";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {authMiddleware, managerAuthMiddleware} from "@/lib/server/middlewares/authentication";


export const getMediaDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator(data => data as {
        external: boolean,
        mediaType: MediaType,
        mediaId: number | string,
    })
    .handler(async ({ data: { mediaType, mediaId, external }, context: { currentUser } }) => {
        const container = await getContainer();
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
        const container = await getContainer();
        const mediaProviderService = container.registries.mediaProviderService.getService(mediaType);
        await mediaProviderService.fetchAndRefreshMediaDetails(apiId);
    });


export const getMediaDetailsToEdit = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, transactionMiddleware])
    .validator((data: any) => data as { mediaType: MediaType, mediaId: number })
    .handler(async ({ data: { mediaType, mediaId } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
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
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.updateMediaEditableFields(mediaId, payload);
    });


export const getJobDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data) => data as {
        name: string,
        job: JobType,
        search: SearchType,
        mediaType: MediaType,
    })
    .handler(async ({ data: { mediaType, job, name, search }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getMediaJobDetails(parseInt(currentUser.id), job, name, search);
    });
