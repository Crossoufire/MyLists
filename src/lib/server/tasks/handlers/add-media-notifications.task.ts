import {z} from "zod";
import {mediaTypeUtils} from "@/lib/utils/mapping";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const addMediaNotificationsTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Send notifications for upcoming media releases",
    },
    inputSchema: z.object({}),
    handler: async (ctx) => {
        ctx.logger.info("Starting: AddMediaNotifications execution.");

        const container = await getContainer();
        const mediaRegistry = container.registries.mediaService;
        const mediaTypes = mediaTypeUtils.getTypesForNotifications();
        const notificationsService = container.services.notifications;

        for (const mediaType of mediaTypes) {
            ctx.logger.info(`Adding ${mediaType} notifications to users...`);

            const mediaService = mediaRegistry.getService(mediaType);
            const allMediaToNotify = await mediaService.getUpcomingMedia(undefined, true);
            await notificationsService.sendMediaNotifications(mediaType, allMediaToNotify);

            ctx.logger.info(`Adding ${mediaType} notifications completed.`);
        }

        ctx.logger.info("Completed: AddMediaNotifications execution.");
    },
});
