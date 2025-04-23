import {db} from "@/lib/server/database/db";
import {alias} from "drizzle-orm/sqlite-core";
import {MediaType} from "@/lib/server/utils/enums";
import {StatsDelta} from "@/lib/server/types/stats.types";
import {getDbClient} from "@/lib/server/database/asyncStorage";
import {and, eq, gt, inArray, ne, SQL, sql} from "drizzle-orm";
import {user, userMediaSettings} from "@/lib/server/database/schema";


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

        // Execute query
        await getDbClient()
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

    static async getHallOfFameData(data: Record<string, any>, currentUserId: number) {
        const { sorting = "normalized", search = "", page = 1, perPage = 10 } = data;

        const mediaTypes = Object.values(MediaType);
        const umsAlias = alias(userMediaSettings, "ums");

        const maxTimePerMedia = db
            .select({
                mediaType: userMediaSettings.mediaType,
                maxTime: sql<number>`max(${userMediaSettings.timeSpent})`.as("max_time"),
            })
            .from(userMediaSettings)
            .where(eq(userMediaSettings.active, true))
            .groupBy(userMediaSettings.mediaType)
            .as("max_time_per_media");

        // Dynamically create normalized score columns
        const normalizedScoreColumns: Record<string, SQL.Aliased<number>> = {};
        mediaTypes.forEach((mt) => normalizedScoreColumns[`${mt}Score`] = sql<number>`sum(
            CASE
                WHEN ${umsAlias.mediaType} = ${mt} AND ${umsAlias.active} = 1 AND ${maxTimePerMedia.maxTime} > 0
                THEN CAST(${umsAlias.timeSpent} AS REAL) / ${maxTimePerMedia.maxTime}
            ELSE 0
        END)`.as(`${mt}_score`));

        // Dynamically construct sum expression for `total_score`
        const totalScoreSumExpression = mediaTypes.map((mt) =>
            sql`
                CASE 
                    WHEN ${umsAlias.mediaType} = ${mt} AND ${umsAlias.active} = 1 AND ${maxTimePerMedia.maxTime} > 0 
                    THEN CAST(${umsAlias.timeSpent} AS REAL) / ${maxTimePerMedia.maxTime} 
                ELSE 0 END
            `,
        ).reduce((acc, curr) => sql`${acc} + ${curr}`);

        const baseQuery = db
            .select({
                id: user.id,
                name: user.name,
                image: user.image,
                ...normalizedScoreColumns,
                totalScore: sql<number>`sum(${totalScoreSumExpression})`.as("total_score"),
                totalTime: sql<number>`sum(CASE WHEN ${umsAlias.active} = 1 THEN ${umsAlias.timeSpent} ELSE 0 END)`.as("total_time"),
            })
            .from(user)
            .innerJoin(umsAlias, eq(user.id, umsAlias.userId))
            .leftJoin(maxTimePerMedia, eq(umsAlias.mediaType, maxTimePerMedia.mediaType))
            .where(ne(user.name, "DemoProfile"))
            .groupBy(user.id, user.name, user.image)
            .as("base_sub");

        // Dynamically construct Ranking window functions
        const rankColumns: Record<string, SQL.Aliased<unknown>> = {};
        mediaTypes.forEach((mt) => {
            const scoreCol = baseQuery[`${mt}Score` as keyof typeof baseQuery];
            rankColumns[`${mt}Rank`] = sql`row_number() OVER (ORDER BY ${scoreCol} DESC)`.as(`${mt}_rank`);
        });

        const allUsersRanked = db
            .with(baseQuery)
            .select({
                id: baseQuery.id,
                name: baseQuery.name,
                image: baseQuery.image,
                ...mediaTypes.reduce((acc, mt) => {
                    const scoreKey = `${mt}Score` as keyof typeof baseQuery;
                    acc[scoreKey] = baseQuery[scoreKey];
                    return acc;
                }, {} as Record<string, any>),
                totalScore: baseQuery.totalScore,
                totalTime: baseQuery.totalTime,
                totalRank: sql`row_number() OVER (ORDER BY ${baseQuery.totalScore} DESC)`.as("total_rank"),
                totalRankTime: sql`row_number() OVER (ORDER BY ${baseQuery.totalTime} DESC)`.as("total_rank_time"),
                ...rankColumns,
            })
            .from(baseQuery)
            .as("all_users_ranked");

        // Determine Sorting Column
        let orderByColumn: any;
        let rankSelectionColName: string;
        if (sorting === "normalized") {
            orderByColumn = allUsersRanked.totalRank;
            rankSelectionColName = "totalRank";
        }
        else if (sorting === "profile") {
            orderByColumn = allUsersRanked.totalRankTime;
            rankSelectionColName = "totalRankTime";
        }
        else {
            const rankCol = allUsersRanked[`${sorting}Rank` as keyof typeof allUsersRanked];
            orderByColumn = rankCol;
            rankSelectionColName = `${sorting}Rank`;
        }

        // Final Query Construction with Search and Pagination
        const finalQueryBase = db.with(allUsersRanked).select().from(allUsersRanked);
        if (search) finalQueryBase.where(sql`lower(${allUsersRanked.name}) LIKE lower(${`%${search}%`})`);

        // Get Total Count for Pagination
        const totalCounter = db.with(allUsersRanked).select({ count: sql<number>`count(*)` }).from(allUsersRanked);
        if (search) totalCounter.where(sql`lower(${allUsersRanked.name}) LIKE lower(${`%${search}%`})`);
        const totalResult = totalCounter.get();

        const total = totalResult?.count ?? 0;
        const pages = Math.ceil(total / perPage);
        const offset = (page - 1) * perPage;

        // Execute Final Paginated Query
        const rankedUsers = await finalQueryBase
            .orderBy(orderByColumn)
            .limit(perPage)
            .offset(offset)
            .execute();

        // Add user settings to map
        const userIds = rankedUsers.map((u) => u.id);
        const allSettings = await db
            .select()
            .from(userMediaSettings)
            .where(inArray(userMediaSettings.userId, userIds))
            .execute();

        const userSettingsMap = new Map<number, (typeof userMediaSettings.$inferSelect)[]>();
        for (const setting of allSettings) {
            if (!userSettingsMap.has(setting.userId)) {
                userSettingsMap.set(setting.userId, []);
            }
            userSettingsMap.get(setting.userId)!.push(setting);
        }

        // Get Media Type Counts
        const mediaTypeCountsResult = await db
            .select({
                mediaType: userMediaSettings.mediaType,
                activeUsers: sql<number>`count(${userMediaSettings.userId})`,
            })
            .from(userMediaSettings)
            .where(and(gt(userMediaSettings.timeSpent, 0), eq(userMediaSettings.active, true)),
            )
            .groupBy(userMediaSettings.mediaType)
            .execute();

        const mediaTypeCountMap = new Map<MediaType, number>();
        mediaTypeCountsResult.forEach((row) => {
            if (row.mediaType) {
                mediaTypeCountMap.set(row.mediaType, row.activeUsers);
            }
        });

        // Get Current User's Ranks
        const currentUserRankData = db
            .with(allUsersRanked)
            .select()
            .from(allUsersRanked)
            .where(eq(allUsersRanked.id, currentUserId))
            .get();

        // Get Current User's Active Media Settings
        const settings = await this.getActiveSettings(currentUserId);
        const currentUserActiveSettings = new Set(settings.map((s) => s.mediaType));

        return {
            mediaTypes,
            currentUserRankData: currentUserRankData!,
            mediaTypeCountMap,
            currentUserActiveSettings,
            rankedUsers,
            userSettingsMap,
            rankSelectionColName,
            page, pages, total,
        };
    }
}
