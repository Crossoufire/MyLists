import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {tryNotFound} from "@/lib/server/utils/try-not-found";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {authMiddleware, managerAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {editMediaDetailsSchema, jobDetailsSchema, mediaDetailsSchema, mediaDetailsToEditSchema, refreshMediaDetailsSchema} from "@/lib/server/types/base.types";


export const getMediaDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: unknown) => {
        return tryNotFound(() => mediaDetailsSchema.parse(data))
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
    .validator((data: unknown) => refreshMediaDetailsSchema.parse(data))
    .handler(async ({ data: { mediaType, apiId } }) => {
        const container = await getContainer();
        const mediaProviderService = container.registries.mediaProviderService.getService(mediaType);
        await mediaProviderService.fetchAndRefreshMediaDetails(apiId);
    });


export const getMediaDetailsToEdit = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, transactionMiddleware])
    .validator((data: unknown) => {
        return tryNotFound(() => mediaDetailsToEditSchema.parse(data))
    })
    .handler(async ({ data: { mediaType, mediaId } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getMediaEditableFields(mediaId);
    });


export const postEditMediaDetails = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, transactionMiddleware])
    .validator((data: unknown) => editMediaDetailsSchema.parse(data))
    .handler(async ({ data: { mediaType, mediaId, payload } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.updateMediaEditableFields(mediaId, payload);
    });


export const getJobDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: unknown) => {
        return tryNotFound(() => jobDetailsSchema.parse(data));
    })
    .handler(async ({ data: { mediaType, job, name, search }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getMediaJobDetails(parseInt(currentUser.id), job, name, search);
    });
