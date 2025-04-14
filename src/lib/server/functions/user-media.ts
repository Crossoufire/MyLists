import {notFound} from "@tanstack/react-router";
import {container} from "@/lib/server/container";
import {createServerFn} from "@tanstack/react-start";
import {MediaType, UpdateType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const postUpdateUserMedia = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator((data: any) => {
        return data as { mediaType: MediaType, mediaId: number, payload: Record<string, any>, updateType: UpdateType };
    })
    .handler(async ({ data, context: { currentUser } }) => {
        const { mediaType, mediaId, payload, updateType } = data;

        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;

        //@ts-expect-error
        const mediaService = container.registries.mediaService.getService(mediaType);

        const mediaDetails = await mediaService.getMinimalMediaDetails(mediaId);
        if (!mediaDetails) throw notFound();

        //@ts-expect-error
        const oldState = await mediaService.getUserMediaDetails(currentUser.id, mediaId);
        //@ts-expect-error
        const newState = await mediaService.updateUserMediaDetails(currentUser.id, mediaId, payload);
        const delta = mediaService.calculateDeltaStats(oldState, newState, mediaDetails);

        //@ts-expect-error
        await userStatsService.updateDeltaUserStats(mediaType, currentUser.id, delta);

        const { oldValue, newValue } = userUpdatesService.extractLogValues(updateType)(oldState, newState);

        await userUpdatesService.logUpdate({
            //@ts-expect-error
            userId: currentUser.id,
            mediaType,
            media: mediaDetails,
            updateType,
            oldValue,
            newValue,
        });
    });


export const postDeleteUserUpdates = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator((data: any) => data as { updateIds: number[], returnData: boolean })
    .handler(async ({ data: { updateIds, returnData }, context: { currentUser } }) => {
        const userUpdatesService = container.services.userUpdates;
        //@ts-expect-error
        return userUpdatesService.deleteUserUpdates(currentUser.id, updateIds, returnData);
    });
