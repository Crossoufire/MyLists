import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {tryNotFound} from "@/lib/server/utils/try-not-found";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";
import {mediaListFiltersSchema, mediaListSchema, mediaListSearchFiltersSchema} from "@/lib/server/types/base.types";
import {FormattedError} from "@/lib/server/utils/error-classes";


export const getMediaListServerFunction = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator(data => tryNotFound(() => mediaListSchema.parse(data)))
    .handler(async ({ data, context: { currentUser, user } }) => {
        const { mediaType, args } = data;
        const container = await getContainer();

        const targetUserId = user.id;
        const currentUserId = currentUser?.id ? parseInt(currentUser.id) : undefined;

        const userService = container.services.user;

        const userHasMediaTypeActive = await userService.hasActiveMediaType(user.id, data.mediaType);
        if (!userHasMediaTypeActive) throw new FormattedError("MediaType not-activated");

        if (currentUser && parseInt(currentUser.id) !== targetUserId) {
            await userService.incrementMediaTypeView(targetUserId, mediaType);
        }

        const mediaService = container.registries.mediaService.getService(mediaType);
        const results = await mediaService.getMediaList(currentUserId, targetUserId, args);

        return { userData: user, mediaType, results };
    });


export const getMediaListFilters = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator(data => mediaListFiltersSchema.parse(data))
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getListFilters(user.id);
    });


export const getMediaListSearchFilters = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .validator(data => mediaListSearchFiltersSchema.parse(data))
    .handler(async ({ data: { mediaType, query, job }, context: { user } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getSearchListFilters(user.id, query, job);
    });
