import {container} from "@/lib/server/container";
import {createServerFn} from "@tanstack/react-start";
import {MediaType, Status, UpdateType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";


export const getUserMediaHistory = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any) => data as { mediaType: MediaType, mediaId: number })
    .handler(async ({ data: { mediaType, mediaId }, context: { currentUser } }) => {
        const userUpdatesService = container.services.userUpdates;
        // @ts-expect-error
        return userUpdatesService.getUserMediaHistory(currentUser.id, mediaType, mediaId);
    });


export const postAddMediaToList = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any) => {
        return data as {
            status?: Status,
            mediaType: MediaType,
            mediaId: number | string,
        }
    })
    .handler(async ({ data: { mediaType, mediaId, status }, context: { currentUser } }) => {
        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const mediaService = container.registries.mediaService.getService(mediaType);

        // @ts-expect-error
        const { newState, media, delta } = await mediaService.addMediaToUserList(currentUser.id, mediaId, status);

        //@ts-expect-error
        await userStatsService.updateDeltaUserStats(mediaType, currentUser.id, delta);

        await userUpdatesService.logUpdate({
            //@ts-expect-error
            userId: currentUser.id,
            mediaType,
            media,
            updateType: UpdateType.STATUS,
            oldState: null,
            newState,
        });

        return newState;
    });


export const postUpdateUserMedia = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any) => {
        return data as {
            mediaId: number,
            mediaType: MediaType,
            updateType?: UpdateType,
            payload: Record<string, any>,
        };
    })
    .handler(async ({ data, context: { currentUser } }) => {
        const { mediaType, mediaId, payload, updateType } = data;

        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const mediaService = container.registries.mediaService.getService(mediaType);

        const {
            oldState,
            newState,
            media,
            delta,
            completeUpdateData,
        } = await mediaService.updateUserMediaDetails(parseInt(currentUser.id), mediaId, payload);

        //@ts-expect-error
        await userStatsService.updateDeltaUserStats(mediaType, currentUser.id, delta);

        if (updateType) {
            await userUpdatesService.logUpdate({
                //@ts-expect-error
                userId: currentUser.id,
                media,
                mediaType,
                updateType,
                oldState,
                newState,
            });
        }

        return completeUpdateData;
    });


export const postRemoveMediaFromList = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any) => data as { mediaId: number, mediaType: MediaType })
    .handler(async ({ data: { mediaType, mediaId }, context: { currentUser } }) => {
        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const mediaService = container.registries.mediaService.getService(mediaType);

        const delta = await mediaService.removeMediaFromUserList(parseInt(currentUser.id), mediaId);
        //@ts-expect-error
        await userUpdatesService.deleteMediaUpdatesForUser(currentUser.id, mediaType, mediaId);
        //@ts-expect-error
        await userStatsService.updateDeltaUserStats(mediaType, currentUser.id, delta);
    });


export const postDeleteUserUpdates = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any) => data as { updateIds: number[], returnData: boolean })
    .handler(async ({ data: { updateIds, returnData }, context: { currentUser } }) => {
        const userUpdatesService = container.services.userUpdates;
        //@ts-expect-error
        return userUpdatesService.deleteUserUpdates(currentUser.id, updateIds, returnData);
    });
