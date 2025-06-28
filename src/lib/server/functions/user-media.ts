import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {Label} from "@/lib/components/user-media/base/LabelsDialog";
import {MediaType, Status, UpdateType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";

import {EditUserLabels} from "@/lib/server/types/base.types";


export const getUserMediaHistory = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any) => data as { mediaType: MediaType, mediaId: number })
    .handler(async ({ data: { mediaType, mediaId }, context: { currentUser } }) => {
        const userUpdatesService = getContainer().services.userUpdates;
        // @ts-expect-error
        return userUpdatesService.getUserMediaHistory(currentUser.id, mediaType, mediaId);
    });


export const postAddMediaToList = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any) => {
        return data as {
            status?: Status,
            mediaId: number,
            mediaType: MediaType,
        }
    })
    .handler(async ({ data: { mediaType, mediaId, status }, context: { currentUser } }) => {
        const currentUserId = parseInt(currentUser.id);

        const userStatsService = getContainer().services.userStats;
        const userUpdatesService = getContainer().services.userUpdates;
        const mediaService = getContainer().registries.mediaService.getService(mediaType);

        const { newState, media, delta } = await mediaService.addMediaToUserList(currentUserId, mediaId, status);
        await userStatsService.updateUserPreComputedStatsWithDelta(mediaType, currentUserId, delta);

        await userUpdatesService.logUpdate({
            userId: currentUserId,
            mediaType,
            media,
            updateType: UpdateType.STATUS,
            os: null,
            ns: newState,
        });

        return newState;
    });


export const postUpdateUserMedia = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any) => {
        data as {
            mediaId: number,
            mediaType: MediaType,
            payload: Record<string, any>,
        };

        if (data.payload?.status) {
            data.updateType = UpdateType.STATUS;
        }
        else if (data.payload?.redo) {
            data.updateType = UpdateType.REDO;
        }
        else if (data.payload?.redo2) {
            data.updateType = UpdateType.REDOTV;
        }
        else if (data.payload?.currentSeason || data.payload?.lastEpisodeWatched) {
            data.updateType = UpdateType.TV;
        }
        else if (data.payload?.playtime) {
            data.updateType = UpdateType.PLAYTIME;
        }

        return data as {
            mediaId: number,
            mediaType: MediaType,
            updateType?: UpdateType,
            payload: Record<string, any>,
        };
    })
    .handler(async ({ data, context: { currentUser } }) => {
        const { mediaType, mediaId, payload, updateType } = data;

        const userId = parseInt(currentUser.id);
        const userStatsService = getContainer().services.userStats;
        const userUpdatesService = getContainer().services.userUpdates;
        const mediaService = getContainer().registries.mediaService.getService(mediaType);

        const { os, ns, media, delta, updateData } = await mediaService.updateUserMediaDetails(userId, mediaId, payload);
        await userStatsService.updateUserPreComputedStatsWithDelta(mediaType, userId, delta);

        if (updateType) {
            await userUpdatesService.logUpdate({ userId, media, mediaType, updateType, os, ns });
        }

        return updateData;
    });


export const postRemoveMediaFromList = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any) => data as { mediaId: number, mediaType: MediaType })
    .handler(async ({ data: { mediaType, mediaId }, context: { currentUser } }) => {
        const currentUserId = parseInt(currentUser.id);
        const userStatsService = getContainer().services.userStats;
        const userUpdatesService = getContainer().services.userUpdates;
        const mediaService = getContainer().registries.mediaService.getService(mediaType);

        const delta = await mediaService.removeMediaFromUserList(parseInt(currentUser.id), mediaId);
        await userUpdatesService.deleteMediaUpdatesForUser(currentUserId, mediaType, mediaId);
        await userStatsService.updateUserPreComputedStatsWithDelta(mediaType, currentUserId, delta);

        // TODO: DELETE NOTIFICATIONS ???
    });


export const postDeleteUserUpdates = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any) => data as { updateIds: number[], returnData: boolean })
    .handler(async ({ data: { updateIds, returnData }, context: { currentUser } }) => {
        const userUpdatesService = getContainer().services.userUpdates;
        //@ts-expect-error
        return userUpdatesService.deleteUserUpdates(currentUser.id, updateIds, returnData);
    });


export const getUserMediaLabels = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any) => data as { mediaType: MediaType })
    .handler(async ({ data: { mediaType }, context: { currentUser } }) => {
        const userId = parseInt(currentUser.id);
        const mediaService = getContainer().registries.mediaService.getService(mediaType);
        return mediaService.getUserMediaLabels(userId);
    });


export const postEditUserLabel = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any) => {
        return data as {
            label: Label,
            mediaId: number,
            mediaType: MediaType,
            action: EditUserLabels["action"],
        };
    })
    .handler(async ({ data: { mediaType, label, action, mediaId }, context: { currentUser } }) => {
        const userId = parseInt(currentUser.id);
        const mediaService = getContainer().registries.mediaService.getService(mediaType);
        return mediaService.editUserLabel({ userId, label, mediaId, action });
    });
