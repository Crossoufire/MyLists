import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {tryNotFound} from "@/lib/utils/try-not-found";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {authMiddleware, managerAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {editMediaDetailsSchema, jobDetailsSchema, mediaDetailsSchema, mediaDetailsToEditSchema, refreshMediaDetailsSchema} from "@/lib/types/zod.schema.types";


export const getMediaDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware, transactionMiddleware])
    .inputValidator((data) => tryNotFound(() => mediaDetailsSchema.parse(data)))
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
    .inputValidator((data) => tryNotFound(() => mediaDetailsToEditSchema.parse(data)))
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


export const getJobDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .inputValidator((data) => tryNotFound(() => jobDetailsSchema.parse(data)))
    .handler(async ({ data: { mediaType, job, name, search }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getMediaJobDetails(currentUser.id, job, name, search);
    });
