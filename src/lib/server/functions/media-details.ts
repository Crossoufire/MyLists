import {createServerFn} from "@tanstack/react-start";
import {tryFormZodError, tryNotFound} from "@/lib/utils/try-not-found";
import {getContainer} from "@/lib/server/core/container";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {authMiddleware, managerAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {MediaType} from "@/lib/utils/enums";
import {
    editMediaDetailsSchema,
    jobDetailsSchema,
    mediaDetailsSchema,
    mediaDetailsToEditSchema,
    refreshMediaDetailsSchema,
    updateBookCoverSchema
} from "@/lib/types/zod.schema.types";


export const getMediaDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware, transactionMiddleware])
    .inputValidator(tryNotFound(mediaDetailsSchema))
    .handler(async ({ data: { mediaType, mediaId, external }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        const mediaProviderService = container.registries.mediaProviderService.getService(mediaType);

        const {
            media,
            userMedia,
            followsData,
            similarMedia,
        } = await mediaService.getMediaAndUserDetails(currentUser.id, mediaId, external, mediaProviderService);

        return { media, userMedia, followsData, similarMedia };
    });


export const refreshMediaDetails = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, transactionMiddleware])
    .inputValidator(refreshMediaDetailsSchema)
    .handler(async ({ data: { mediaType, apiId } }) => {
        const container = await getContainer();
        const mediaProviderService = container.registries.mediaProviderService.getService(mediaType);
        await mediaProviderService.fetchAndRefreshMediaDetails(apiId);
    });


export const getMediaDetailsToEdit = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, transactionMiddleware])
    .inputValidator(tryNotFound(mediaDetailsToEditSchema))
    .handler(async ({ data: { mediaType, mediaId } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getMediaEditableFields(mediaId);
    });


export const postEditMediaDetails = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, transactionMiddleware])
    .inputValidator(editMediaDetailsSchema)
    .handler(async ({ data: { mediaType, mediaId, payload } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.updateMediaEditableFields(mediaId, payload);
    });


export const postUpdateBookCover = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(updateBookCoverSchema))
    .handler(async ({ data: { apiId, imageUrl, imageFile } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(MediaType.BOOKS);
        await mediaService.updateDefaultCover(apiId, { imageUrl, imageFile });
    });


export const getJobDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .inputValidator(tryNotFound(jobDetailsSchema))
    .handler(async ({ data: { mediaType, job, name, search }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getMediaJobDetails(currentUser.id, job, name, search);
    });
