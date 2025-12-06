import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {tryNotFound} from "@/lib/utils/try-not-found";
import {FormattedError} from "@/lib/utils/error-classes";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";
import {MediaListDataByType} from "@/lib/server/domain/media/base/base.repository";
import {mediaListFiltersSchema, mediaListSchema, mediaListSearchFiltersSchema} from "@/lib/types/zod.schema.types";


export const getMediaListServerFunction = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .inputValidator((data) => tryNotFound(() => mediaListSchema.parse(data)))
    .handler(async ({ data, context: { currentUser, user } }) => {
        const { mediaType, args } = data;
        const container = await getContainer();

        const targetUserId = user.id;
        const userService = container.services.user;
        const currentUserId = currentUser?.id ? currentUser.id : undefined;

        const userHasMediaTypeActive = await userService.hasActiveMediaType(user.id, data.mediaType);
        if (!userHasMediaTypeActive) {
            throw new FormattedError("MediaType not-activated");
        }

        if (currentUser && currentUser.id !== targetUserId) {
            await userService.incrementMediaTypeView(targetUserId, mediaType);
        }

        const mediaService = container.registries.mediaService.getService(mediaType);
        const results = await mediaService.getMediaList(currentUserId, targetUserId, args) as MediaListDataByType[typeof mediaType];

        return { userData: user, mediaType, results };
    });


export const getMediaListFilters = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .inputValidator((data) => mediaListFiltersSchema.parse(data))
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getListFilters(user.id);
    });


export const getMediaListSearchFilters = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .inputValidator((data) => mediaListSearchFiltersSchema.parse(data))
    .handler(async ({ data: { mediaType, query, job }, context: { user } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getSearchListFilters(user.id, query, job);
    });
