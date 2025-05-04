import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const serverGetMediaList = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ data, context: { currentUser, user } }) => {
        const { mediaType, args } = data;

        const targetUserId = user.id;
        const currentUserId = currentUser?.id ? parseInt(currentUser.id) : undefined;
        const userService = getContainer().services.user;
        const mediaServiceRegistry = getContainer().registries.mediaService;

        // Check if targetUser has this media type active
        const userHasMediaTypeActive = await userService.hasActiveMediaType(user.id, data.mediaType);
        if (!userHasMediaTypeActive) {
            throw new Error("This user does not have this MediaType activated");
        }

        // @ts-expect-error
        if (currentUser && currentUser.id !== targetUserId) {
            await userService.incrementMediaTypeView(targetUserId, mediaType);
        }

        const mediaService = mediaServiceRegistry.getService(mediaType);
        const results = await mediaService.getMediaList(currentUserId, targetUserId, args);

        return { userData: user, mediaType, results };
    });


export const getMediaListFilters = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const mediaServiceRegistry = getContainer().registries.mediaService;
        const mediaService = mediaServiceRegistry.getService(mediaType);
        const results = await mediaService.getListFilters(user.id);
        return results;
    });


export const getMediaListSearchFilters = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .handler(async ({ data: { mediaType, query, job }, context: { user } }) => {
        const mediaServiceRegistry = getContainer().registries.mediaService;
        const mediaService = mediaServiceRegistry.getService(mediaType);
        const results = await mediaService.getSearchListFilters(user.id, query, job);
        return results;
    });
