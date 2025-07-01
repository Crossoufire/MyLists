import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {MediaListArgs} from "@/lib/server/types/base.types";
import {JobType, MediaType} from "@/lib/server/utils/enums";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getMediaListServerFunction = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator(data => data as { mediaType: MediaType, args: MediaListArgs })
    .handler(async ({ data, context: { currentUser, user } }) => {
        const { mediaType, args } = data;

        const targetUserId = user.id;
        const currentUserId = currentUser?.id ? parseInt(currentUser.id) : undefined;

        const userService = getContainer().services.user;

        // Check targetUser has mediaType active
        const userHasMediaTypeActive = await userService.hasActiveMediaType(user.id, data.mediaType);
        if (!userHasMediaTypeActive) {
            throw new Error("MediaType not-activated");
        }

        // @ts-expect-error
        if (currentUser && currentUser.id !== targetUserId) {
            await userService.incrementMediaTypeView(targetUserId, mediaType);
        }

        const mediaService = getContainer().registries.mediaService.getService(mediaType);
        const results = await mediaService.getMediaList(currentUserId, targetUserId, args);

        return { userData: user, mediaType, results };
    });


export const getMediaListFilters = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator((data: any) => data as { mediaType: MediaType })
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const mediaService = getContainer().registries.mediaService.getService(mediaType);
        const filters = await mediaService.getListFilters(user.id);
        return filters;
    });


export const getMediaListSearchFilters = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator((data: any) => data as { mediaType: MediaType, query: string, job: JobType })
    .handler(async ({ data: { mediaType, query, job }, context: { user } }) => {
        const mediaService = getContainer().registries.mediaService.getService(mediaType);
        return mediaService.getSearchListFilters(user.id, query, job);
    });


