import {container} from "@/lib/server/container";
import {createServerFn} from "@tanstack/react-start";
import {MediaType, Status, UpdateType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {EditUserLabels} from "@/lib/server/domain/media/base/base.repository";
import {Label} from "@/lib/components/user-media/LabelsDialog";


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

        return data as {
            mediaId: number,
            mediaType: MediaType,
            payload: Record<string, any>,
            updateType?: UpdateType,
        };
    })
    .handler(async ({ data, context: { currentUser } }) => {
        const { mediaType, mediaId, payload, updateType } = data;

        const userId = parseInt(currentUser.id);
        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const mediaService = container.registries.mediaService.getService(mediaType);

        const { os, ns, media, delta, updateData } = await mediaService.updateUserMediaDetails(userId, mediaId, payload);

        //@ts-expect-error
        await userStatsService.updateDeltaUserStats(mediaType, currentUser.id, delta);

        if (updateType) {
            await userUpdatesService.logUpdate({ userId, media, mediaType, updateType, os, ns });
        }

        return updateData;
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


export const getUserMediaLabels = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any) => data as { mediaType: MediaType })
    .handler(async ({ data: { mediaType }, context: { currentUser } }) => {
        const userId = parseInt(currentUser.id);
        const mediaService = container.registries.mediaService.getService(mediaType);
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
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.editUserLabel({ userId, label, mediaId, action });
    });
