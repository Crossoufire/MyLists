import {z} from "zod";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";
import {withTransaction} from "@/lib/server/database/async-storage";


export const removeNonListMediaTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Remove media items not in any user's list",
    },
    inputSchema: z.object({}),
    handler: async (ctx) => {
        ctx.logger.info(`Starting: RemoveNonListMedia...`);

        const container = await getContainer();
        const mediaTypes = Object.values(MediaType);
        const mediaRegistry = container.registries.mediaService;
        const userUpdatesService = container.services.userUpdates;
        const notificationsService = container.services.notifications;

        for (const mediaType of mediaTypes) {
            ctx.logger.info({ mediaType }, "Removing non-list media...");

            await withTransaction(async (_tx) => {
                const mediaService = mediaRegistry.getService(mediaType);
                const mediaIds = await mediaService.getNonListMediaIds();
                ctx.logger.info(`Found ${mediaIds.length} non-list ${mediaType} to remove.`);

                // Remove in other services
                await userUpdatesService.deleteMediaUpdates(mediaType, mediaIds);
                await notificationsService.deleteNotifications(mediaType, mediaIds);

                // Remove main media and associated tables: actors, genres, companies, authors...
                await mediaService.removeMediaByIds(mediaIds);
            });

            ctx.logger.info({ mediaType }, "Removal completed");
        }

        ctx.logger.info("Completed: RemoveNonListMedia execution.");
    },
});
