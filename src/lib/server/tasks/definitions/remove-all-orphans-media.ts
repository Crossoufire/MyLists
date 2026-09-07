import {z} from "zod";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";
import {withTransaction} from "@/lib/server/database/async-storage";


export const removeAllOrphansMediaTask = defineTask({
    name: "remove-all-orphans-media" as const,
    visibility: "admin",
    description: "Remove media items not in any user's list and collections",
    inputSchema: z.object({}),
    handler: async (ctx) => {
        const container = await getContainer();
        const mediaTypes = Object.values(MediaType);
        const mediaRegistry = container.registries.mediaService;
        const updateHistoryService = container.services.updateHistory;
        const notificationsService = container.services.notifications;

        for (const mediaType of mediaTypes) {
            await ctx.step(`remove-${mediaType}`, async () => {

                withTransaction((_tx) => {
                    const mediaService = mediaRegistry.get(mediaType);
                    const mediaIdsToRemove = mediaService.getOrphanedMediaIds();
                    ctx.metric(`${mediaType}.removed`, mediaIdsToRemove.length);

                    // Remove in other services
                    updateHistoryService.deleteMediaUpdates(mediaType, mediaIdsToRemove);
                    notificationsService.deleteMediaNotifications(mediaType, mediaIdsToRemove);
                    container.services.whichCameFirst.deletePoolMedia(mediaType, mediaIdsToRemove);

                    // Remove main media and associated tables: actors, genres, companies, authors...
                    mediaService.removeMediaByIds(mediaIdsToRemove);
                });
            });
        }
    },
});
