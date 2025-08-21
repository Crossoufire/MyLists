import {UpdateType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {addMediaToListSchema, deleteUserUpdatesSchema, editUserLabelSchema, mediaActionSchema, updateUserMediaSchema, userMediaLabelsSchema} from "@/lib/server/types/base.types";


export const getUserMediaHistory = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(data => mediaActionSchema.parse(data))
    .handler(async ({ data: { mediaType, mediaId }, context: { currentUser } }) => {
        const userUpdatesService = await getContainer().then(c => c.services.userUpdates);
        return userUpdatesService.getUserMediaHistory(currentUser.id, mediaType, mediaId);
    });


export const postAddMediaToList = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data => addMediaToListSchema.parse(data)))
    .handler(async ({ data: { mediaType, mediaId, status }, context: { currentUser } }) => {
        const container = await getContainer();

        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const mediaService = container.registries.mediaService.getService(mediaType);

        const { newState, media, delta, logPayload } = await mediaService.addMediaToUserList(currentUser.id, mediaId, status);
        await userStatsService.updateUserPreComputedStatsWithDelta(mediaType, currentUser.id, delta);

        await userUpdatesService.logUpdate({
            media,
            mediaType,
            userId: currentUser.id,
            updateType: UpdateType.STATUS,
            payload: { old_value: logPayload.oldValue, new_value: logPayload.newValue },
        });

        return newState;
    });


export const postUpdateUserMedia = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator(updateUserMediaSchema)
    .handler(async ({ data, context: { currentUser } }) => {
        const { mediaType, mediaId, payload } = data;

        const container = await getContainer();
        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const mediaService = container.registries.mediaService.getService(mediaType);

        const { newState, media, delta, logPayload } = await mediaService.updateUserMediaDetails(currentUser.id, mediaId, payload as any);
        await userStatsService.updateUserPreComputedStatsWithDelta(mediaType, currentUser.id, delta);

        if (logPayload) {
            await userUpdatesService.logUpdate({
                media,
                mediaType,
                userId: currentUser.id,
                updateType: payload.type,
                payload: { old_value: logPayload.oldValue, new_value: logPayload.newValue },
            });
        }

        return newState;
    });


export const postRemoveMediaFromList = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator(data => mediaActionSchema.parse(data))
    .handler(async ({ data: { mediaType, mediaId }, context: { currentUser } }) => {
        const container = await getContainer();
        const notifService = container.services.notifications;
        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const mediaService = container.registries.mediaService.getService(mediaType);

        const delta = await mediaService.removeMediaFromUserList(currentUser.id, mediaId);
        await userUpdatesService.deleteMediaUpdatesForUser(currentUser.id, mediaType, mediaId);
        await notifService.deleteUserMediaNotifications(currentUser.id, mediaType, mediaId);
        await userStatsService.updateUserPreComputedStatsWithDelta(mediaType, currentUser.id, delta);
    });


export const postDeleteUserUpdates = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator(data => deleteUserUpdatesSchema.parse(data))
    .handler(async ({ data: { updateIds, returnData }, context: { currentUser } }) => {
        const userUpdatesService = await getContainer().then(c => c.services.userUpdates);
        return userUpdatesService.deleteUserUpdates(currentUser.id, updateIds, returnData);
    });


export const getUserMediaLabels = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(data => userMediaLabelsSchema.parse(data))
    .handler(async ({ data: { mediaType }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.getUserMediaLabels(currentUser.id);
    });


export const postEditUserLabel = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator(data => editUserLabelSchema.parse(data))
    .handler(async ({ data: { mediaType, label, action, mediaId }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(mediaType);
        return mediaService.editUserLabel(currentUser.id, label, mediaId, action);
    });
