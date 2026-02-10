import {z} from "zod";
import {db} from "@/lib/server/database/db";
import {MediaType} from "@/lib/utils/enums";
import {user} from "@/lib/server/database/schema";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const backfillActivityTask = defineTask({
    name: "backfill-users-activity" as const,
    visibility: "admin",
    description: "Backfill Users Activity",
    inputSchema: z.object({}),
    handler: async (ctx) => {
        const userStatsRepository = await getContainer().then(c => c.repositories.userStats);

        const userIds = await db.select({ id: user.id }).from(user);
        const start = new Date(Date.UTC(2026, 1, 0, 23, 59, 59));
        const end = new Date(Date.UTC(2026, 2, 0, 23, 59, 59));

        function computeActivityEventsFromHistory(mediaType: MediaType, logEntries: any[], baseline?: any) {
            const events: any[] = [];
            const ledger = baseline ? [baseline, ...logEntries] : logEntries;

            for (let i = 1; i < ledger.length; i += 1) {
                const curr = ledger[i];
                const prev = ledger[i - 1];

                const specificGained = (mediaType === MediaType.GAMES)
                    ? curr.timeSpent - prev.timeSpent
                    : curr.totalSpecific - prev.totalSpecific;

                events.push({
                    id: 0,
                    specificGained,
                    userId: curr.userId,
                    mediaId: curr.mediaId,
                    mediaType: curr.mediaType,
                    lastUpdate: curr.timestamp,
                    isRedo: curr.totalRedo > prev.totalRedo,
                    isCompleted: curr.statusCounts.Completed > prev.statusCounts.Completed,
                });
            }

            return events;
        }

        userIds.forEach((user) => {
            Object.values(MediaType).forEach(async (mediaType) => {
                const logEntries = await userStatsRepository.getEntriesInRange(user.id, mediaType, start, end);
                if (logEntries.length === 0) return [];

                const baseline = await userStatsRepository.getLastEntryBefore(user.id, mediaType, logEntries[0].timestamp);
                const events = computeActivityEventsFromHistory(mediaType, logEntries, baseline);
                const eventsWithGain = events.filter((event) => event.specificGained > 0);

                await userStatsRepository.logActivity(eventsWithGain);
            });
        });

        ctx.metric("done", 1);
    },
});
