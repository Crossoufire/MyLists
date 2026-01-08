import {z} from "zod";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";
import {withTransaction} from "@/lib/server/database/async-storage";


export const removeNonListMediaTask = defineTask({
    name: "remove-non-list-media" as const,
    visibility: "admin",
    description: "Remove media items not in any user's list",
    inputSchema: z.object({}),
    handler: async (ctx) => {
        const container = await getContainer();
        const mediaTypes = Object.values(MediaType);
        const mediaRegistry = container.registries.mediaService;
        const userUpdatesService = container.services.userUpdates;
        const notificationsService = container.services.notifications;

        for (const mediaType of mediaTypes) {
            await ctx.step(`remove-${mediaType}`, async () => {

                await withTransaction(async (_tx) => {
                    const mediaService = mediaRegistry.getService(mediaType);
                    const mediaIds = await mediaService.getNonListMediaIds();
                    ctx.metric(`${mediaType}.removed`, mediaIds.length);

                    // Remove in other services
                    await userUpdatesService.deleteMediaUpdates(mediaType, mediaIds);
                    await notificationsService.deleteNotifications(mediaType, mediaIds);

                    // Remove main media and associated tables: actors, genres, companies, authors...
                    await mediaService.removeMediaByIds(mediaIds);
                });
            });
        }
    },
});
