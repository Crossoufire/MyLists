import {and, eq, sql} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {MediaType} from "@/lib/server/utils/enums";
import {StatsDelta} from "@/lib/server/types/stats.types";
import {userMediaSettings} from "@/lib/server/database/schema";


export class UserStatsRepository {
    static async getActiveSettings(userId: number) {
        const settings = await db.query.userMediaSettings.findMany({
            where: and(eq(userMediaSettings.userId, userId), eq(userMediaSettings.active, true)),
        });
        return settings;
    }

    static async updateDeltaUserStats(userId: number, mediaType: MediaType, delta: StatsDelta) {
        const setUpdates: Record<string, any> = {};

        const numericFields: (keyof StatsDelta)[] = [
            "timeSpent", "views", "totalEntries", "totalRedo", "entriesRated",
            "sumEntriesRated", "entriesCommented", "entriesFavorites", "totalSpecific",
        ];

        for (const field of numericFields) {
            if (delta[field] !== undefined && delta[field] !== 0) {
                const column = userMediaSettings[field];
                setUpdates[field] = sql`${column} + ${delta[field]!}`;
            }
        }

        if (delta.statusCounts && Object.keys(delta.statusCounts).length > 0) {
            let jsonUpdateSql = sql`${userMediaSettings.statusCounts}`;
            for (const [status, change] of Object.entries(delta.statusCounts)) {
                if (change !== 0) {
                    jsonUpdateSql = sql`json_set(
                        COALESCE(${jsonUpdateSql}, '{}'),
                        '$.${sql.raw(status)}',
                        COALESCE(json_extract(COALESCE(${jsonUpdateSql}, '{}'), '$.${sql.raw(status)}'), 0) + ${change}
                    )`;
                }
            }
            setUpdates.statusCounts = jsonUpdateSql;
        }

        const deltaEntriesRated = delta.entriesRated ?? 0;
        const deltaSumEntriesRated = delta.sumEntriesRated ?? 0;
        setUpdates.averageRating = sql<number | null>`
            CASE
                WHEN COALESCE(${userMediaSettings.entriesRated}, 0) + ${deltaEntriesRated} <= 0 
                THEN NULL
                ELSE (CAST(COALESCE(${userMediaSettings.sumEntriesRated}, 0) + ${deltaSumEntriesRated} AS REAL) / 
                (COALESCE(${userMediaSettings.entriesRated}, 0) + ${deltaEntriesRated}))
            END`;

        if (Object.keys(setUpdates).length === 0) return;

        await db
            .update(userMediaSettings)
            .set(setUpdates)
            .where(and(eq(userMediaSettings.userId, userId), eq(userMediaSettings.mediaType, mediaType)))
    }

    static async getSpecificSetting(userId: number, mediaType: MediaType) {
        const setting = await db.query.userMediaSettings.findFirst({
            where: and(eq(userMediaSettings.userId, userId), eq(userMediaSettings.mediaType, mediaType)),
        });

        return setting!;
    }
}
