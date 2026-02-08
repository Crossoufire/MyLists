import {MediaType} from "@/lib/utils/enums";
import {alias} from "drizzle-orm/sqlite-core";
import {DeltaStats} from "@/lib/types/stats.types";
import {UserMediaStats} from "@/lib/types/base.types";
import {SearchType} from "@/lib/types/zod.schema.types";
import {getDbClient} from "@/lib/server/database/async-storage";
import {resolvePagination, resolveSorting} from "@/lib/server/database/pagination";
import {user, userMediaActivity, userMediaSettings, userMediaStatsHistory} from "@/lib/server/database/schema";
import {and, asc, count, countDistinct, desc, eq, gt, gte, inArray, lt, lte, ne, SQL, sql, sum} from "drizzle-orm";


export class UserStatsRepository {
    static async userActiveMediaSettings(userId: number) {
        return getDbClient()
            .select()
            .from(userMediaSettings)
            .where(and(eq(userMediaSettings.userId, userId), eq(userMediaSettings.active, true)));
    }

    static async updateUserMediaListSettings(userId: number, payload: Partial<Record<MediaType, boolean>>) {
        const updateCases = Object.entries(payload).map(([mediaType, active]) => {
            return sql`WHEN ${userMediaSettings.mediaType} = ${mediaType} THEN ${active}`;
        });

        await getDbClient()
            .update(userMediaSettings)
            .set({ active: sql`CASE ${sql.join(updateCases, sql` `)} ELSE ${userMediaSettings.active} END` })
            .where(eq(userMediaSettings.userId, userId))
    }

    static async updateUserPreComputedStatsWithDelta(userId: number, mediaType: MediaType, mediaId: number, delta: DeltaStats) {
        type UserMediaSettingsUpdate = Partial<{
            [K in keyof typeof userMediaSettings]: (typeof userMediaSettings)[K] | ReturnType<typeof sql>;
        }>;

        const setUpdates: UserMediaSettingsUpdate = {};

        const numericFields: (keyof DeltaStats)[] = [
            "timeSpent", "views", "totalEntries", "totalRedo", "entriesRated",
            "sumEntriesRated", "entriesCommented", "entriesFavorites", "totalSpecific",
        ];

        for (const field of numericFields) {
            const deltaValue = delta[field];
            if (deltaValue !== undefined && deltaValue !== 0) {
                setUpdates[field] = sql`${userMediaSettings[field]} + ${deltaValue}`;
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

        if (Object.keys(setUpdates).length === 0) {
            return;
        }

        const [lastUpdate] = await getDbClient()
            .update(userMediaSettings)
            .set(setUpdates)
            .where(and(eq(userMediaSettings.userId, userId), eq(userMediaSettings.mediaType, mediaType)))
            .returning();

        if (lastUpdate) {
            const { id: _id, ...updateSnapshot } = lastUpdate;
            await getDbClient()
                .insert(userMediaStatsHistory)
                .values({
                    mediaId: mediaId,
                    ...updateSnapshot,
                });
        }
    }

    static async userHallofFameData(userId: number, filters: SearchType) {
        const { search = "" } = filters;
        const sorting = resolveSorting(filters.sorting, ["normalized", "profile", ...Object.values(MediaType)] as const, "normalized");

        const { page, perPage, offset, limit } = resolvePagination({
            defaultPerPage: 10,
            page: filters.page,
            perPage: filters.perPage,
        });

        const mediaTypes = Object.values(MediaType);
        const umsAlias = alias(userMediaSettings, "ums");

        const maxTimePerMedia = getDbClient()
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
        mediaTypes.forEach((mt) => {
            normalizedScoreColumns[`${mt}Score`] = sql<number>`sum(
                CASE
                    WHEN ${umsAlias.mediaType} = ${mt} AND ${umsAlias.active} = 1 AND ${maxTimePerMedia.maxTime} > 0
                    THEN CAST(${umsAlias.timeSpent} AS REAL) / ${maxTimePerMedia.maxTime}
                ELSE 0
            END)`.as(`${mt}_score`)
        });

        // Dynamically construct sum expression for `total_score`
        const totalScoreSumExpression = mediaTypes.map((mt) =>
            sql`
                CASE 
                    WHEN ${umsAlias.mediaType} = ${mt} AND ${umsAlias.active} = 1 AND ${maxTimePerMedia.maxTime} > 0 
                    THEN CAST(${umsAlias.timeSpent} AS REAL) / ${maxTimePerMedia.maxTime} 
                ELSE 0 
                END
            `,
        ).reduce((acc, curr) => sql`${acc} + ${curr}`);

        const baseQuery = getDbClient()
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
        const rankColumns: Record<string, SQL.Aliased> = {};
        mediaTypes.forEach((mt) => {
            const scoreCol = baseQuery[`${mt}Score` as keyof typeof baseQuery];
            rankColumns[`${mt}Rank`] = sql`row_number() OVER (ORDER BY ${scoreCol} DESC)`.as(`${mt}_rank`);
        });

        const allUsersRanked = getDbClient()
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
        const finalQueryBase = getDbClient()
            .with(allUsersRanked)
            .select()
            .from(allUsersRanked);

        if (search)
            finalQueryBase.where(sql`lower(${allUsersRanked.name}) LIKE lower(${`%${search}%`})`);

        // Get Total Count for Pagination
        const totalCounter = getDbClient()
            .with(allUsersRanked)
            .select({ count: sql<number>`count(*)` })
            .from(allUsersRanked);

        if (search) {
            totalCounter.where(sql`lower(${allUsersRanked.name}) LIKE lower(${`%${search}%`})`);
        }

        const totalResult = totalCounter.get();
        const total = totalResult?.count ?? 0;
        const pages = Math.ceil(total / perPage);

        // Execute Final Paginated Query
        const rankedUsers = await finalQueryBase
            .orderBy(orderByColumn)
            .limit(limit)
            .offset(offset);

        // Add user settings to map
        const userIds = rankedUsers.map((u) => u.id);
        const allSettings = await getDbClient()
            .select()
            .from(userMediaSettings)
            .where(inArray(userMediaSettings.userId, userIds));

        const userSettingsMap = new Map<number, { mediaType: MediaType, active: boolean, timeSpent: number }[]>();
        for (const setting of allSettings) {
            if (!userSettingsMap.has(setting.userId)) {
                userSettingsMap.set(setting.userId, []);
            }
            userSettingsMap.get(setting.userId)!.push({
                active: setting.active,
                mediaType: setting.mediaType,
                timeSpent: setting.timeSpent,
            });
        }

        // Get Media Type Counts
        const mediaTypeCountsResult = await getDbClient()
            .select({
                mediaType: userMediaSettings.mediaType,
                activeUsers: sql<number>`count(${userMediaSettings.userId})`,
            })
            .from(userMediaSettings)
            .where(and(gt(userMediaSettings.timeSpent, 0), eq(userMediaSettings.active, true)),
            )
            .groupBy(userMediaSettings.mediaType);

        const mediaTypeCountMap = new Map<MediaType, number>();
        mediaTypeCountsResult.forEach((row) => {
            if (row.mediaType) {
                mediaTypeCountMap.set(row.mediaType, row.activeUsers);
            }
        });

        // Get Current User's Ranks
        const currentUserRankData = getDbClient()
            .with(allUsersRanked)
            .select()
            .from(allUsersRanked)
            .where(eq(allUsersRanked.id, userId))
            .get();

        // Get Current User's Active Media Settings
        const settings = await this.userActiveMediaSettings(userId);
        const currentUserActiveSettings = new Set(settings.map((s) => s.mediaType));

        return {
            mediaTypes,
            rankedUsers,
            userSettingsMap,
            mediaTypeCountMap,
            rankSelectionColName,
            currentUserActiveSettings,
            currentUserRankData: currentUserRankData!,
            page, pages, total,
        };
    }

    static async updateAllUsersPreComputedStats(mediaType: MediaType, userStats: UserMediaStats[]) {
        const tx = getDbClient();

        for (const stats of userStats) {
            await tx
                .update(userMediaSettings)
                .set({ ...stats, mediaType })
                .where(and(eq(userMediaSettings.userId, stats.userId), eq(userMediaSettings.mediaType, mediaType)));
        }
    }

    static async getAggregatedMediaStats({ userId, mediaType }: { userId?: number, mediaType: MediaType }) {
        const conditions = [eq(userMediaSettings.mediaType, mediaType)];
        if (userId) {
            conditions.push(eq(userMediaSettings.userId, userId));
        }

        const stats = getDbClient()
            .select({
                totalEntries: sum(userMediaSettings.totalEntries).mapWith(Number),
                totalRedo: sum(userMediaSettings.totalRedo).mapWith(Number),
                timeSpentHours: sql`SUM(${userMediaSettings.timeSpent}) / 60.0`.mapWith(Number),
                totalRated: sum(userMediaSettings.entriesRated).mapWith(Number),
                sumOfAllRatings: sum(userMediaSettings.sumEntriesRated).mapWith(Number),
                totalFavorites: sum(userMediaSettings.entriesFavorites).mapWith(Number),
                totalComments: sum(userMediaSettings.entriesCommented).mapWith(Number),
                totalSpecific: sum(userMediaSettings.totalSpecific).mapWith(Number),
            })
            .from(userMediaSettings)
            .where(and(...conditions))
            .get();

        if (!stats) {
            throw new Error("No stats found");
        }

        const statusCountsResult = await getDbClient()
            .select({ statusCounts: userMediaSettings.statusCounts })
            .from(userMediaSettings)
            .where(and(...conditions));

        const totalStatusCounts = statusCountsResult.reduce((acc: Record<string, number>, setting) => {
            for (const [status, count] of Object.entries(setting.statusCounts)) {
                acc[status] = (acc[status] || 0) + count;
            }
            return acc;
        }, {});

        const statusesCounts = Object
            .entries(totalStatusCounts)
            .map(([status, count]) => ({ name: status, value: count }));

        return {
            statusesCounts,
            totalRedo: stats.totalRedo ?? 0,
            totalRated: stats.totalRated ?? 0,
            totalEntries: stats.totalEntries ?? 0,
            totalComments: stats.totalComments ?? 0,
            totalSpecific: stats.totalSpecific ?? 0,
            timeSpentHours: stats.timeSpentHours ?? 0,
            totalFavorites: stats.totalFavorites ?? 0,
            timeSpentDays: (stats.timeSpentHours ?? 0) / 24,
            avgRated: (!stats.totalRated || stats.totalRated === 0) ? null : (stats.sumOfAllRatings / stats.totalRated),
        };
    }

    static async getPreComputedStatsSummary({ userId }: { userId?: number }) {
        const forUser = userId ? eq(userMediaSettings.userId, userId) : undefined;

        const preComputedStats = getDbClient()
            .select({
                totalRedo: sum(userMediaSettings.totalRedo).mapWith(Number),
                distinctMediaTypes: countDistinct(userMediaSettings.mediaType),
                totalRated: sum(userMediaSettings.entriesRated).mapWith(Number),
                totalEntries: sum(userMediaSettings.totalEntries).mapWith(Number),
                totalComments: sum(userMediaSettings.entriesCommented).mapWith(Number),
                totalFavorites: sum(userMediaSettings.entriesFavorites).mapWith(Number),
                sumOfAllRatings: sum(userMediaSettings.sumEntriesRated).mapWith(Number),
                totalHours: sql<number>`sum(${userMediaSettings.timeSpent}) / 60.0`.mapWith(Number),
            })
            .from(userMediaSettings)
            .where(forUser)
            .get();

        if (!preComputedStats) throw new Error("No stats found");

        const statusCountsList = await getDbClient()
            .select({ statusCounts: userMediaSettings.statusCounts })
            .from(userMediaSettings)
            .where(forUser);

        const mediaTimeDistribution = await getDbClient()
            .select({
                name: userMediaSettings.mediaType,
                value: sql`sum(${userMediaSettings.timeSpent}) / 60.0`.mapWith(Number),
            })
            .from(userMediaSettings)
            .where(forUser)
            .groupBy(userMediaSettings.mediaType);

        let totalUsers = 0;
        if (!userId) {
            totalUsers = getDbClient()
                .select({ count: count() })
                .from(user)
                .get()?.count ?? 0;
        }

        return {
            preComputedStats: {
                totalRedo: preComputedStats?.totalRedo ?? 0,
                totalRated: preComputedStats?.totalRated ?? 0,
                totalHours: preComputedStats?.totalHours ?? 0,
                totalEntries: preComputedStats?.totalEntries ?? 0,
                totalComments: preComputedStats?.totalComments ?? 0,
                totalFavorites: preComputedStats?.totalFavorites ?? 0,
                sumOfAllRatings: preComputedStats?.sumOfAllRatings ?? 0,
                distinctMediaTypes: preComputedStats?.distinctMediaTypes ?? 0,
            },
            totalUsers,
            statusCountsList,
            mediaTimeDistribution,
        };
    }

    // --- Wrapped -----------------------------------------------

    static async getEntriesInRange(userId: number, mediaType: MediaType, start: Date, end: Date) {
        return getDbClient()
            .select()
            .from(userMediaStatsHistory)
            .where(and(
                eq(userMediaStatsHistory.userId, userId),
                eq(userMediaStatsHistory.mediaType, mediaType),
                gte(userMediaStatsHistory.timestamp, start.toISOString()),
                lte(userMediaStatsHistory.timestamp, end.toISOString()),
            ))
            .orderBy(asc(userMediaStatsHistory.timestamp));
    }

    static async getLastEntryBefore(userId: number, mediaType: MediaType, timestamp: string) {
        return getDbClient()
            .select()
            .from(userMediaStatsHistory)
            .where(and(
                eq(userMediaStatsHistory.userId, userId),
                eq(userMediaStatsHistory.mediaType, mediaType),
                lt(userMediaStatsHistory.timestamp, timestamp),
            ))
            .orderBy(desc(userMediaStatsHistory.timestamp))
            .limit(1)
            .get();
    }

    // --- Activity Events -------------------------------------------------------

    static async logActivityEvents(events: {
        userId: number;
        mediaId: number;
        mediaType: MediaType;
        specificGained: number;
        isCompleted: boolean;
        isRedo: boolean;
        timestamp?: string;
    }[]) {
        if (events.length === 0) return;

        await getDbClient()
            .insert(userMediaActivity)
            .values(events.map((event) => ({
                userId: event.userId,
                mediaId: event.mediaId,
                mediaType: event.mediaType,
                specificGained: event.specificGained,
                isCompleted: event.isCompleted,
                isRedo: event.isRedo,
                ...(event.timestamp ? { timestamp: event.timestamp } : {}),
            })));
    }

    static async getActivityEventsInRange(userId: number, mediaType: MediaType, start: Date, end: Date) {
        return getDbClient()
            .select()
            .from(userMediaActivity)
            .where(and(
                eq(userMediaActivity.userId, userId),
                eq(userMediaActivity.mediaType, mediaType),
                gte(userMediaActivity.timestamp, start.toISOString()),
                lte(userMediaActivity.timestamp, end.toISOString()),
            ))
            .orderBy(asc(userMediaActivity.timestamp));
    }

    static async getActivityEventsForRange(userId: number, start: Date, end: Date, filters: {
        mediaType?: MediaType;
        mediaId?: number;
    }) {
        const conditions = [
            eq(userMediaActivity.userId, userId),
            gte(userMediaActivity.timestamp, start.toISOString()),
            lte(userMediaActivity.timestamp, end.toISOString()),
        ];

        if (filters.mediaType) {
            conditions.push(eq(userMediaActivity.mediaType, filters.mediaType));
        }
        if (filters.mediaId) {
            conditions.push(eq(userMediaActivity.mediaId, filters.mediaId));
        }

        return getDbClient()
            .select()
            .from(userMediaActivity)
            .where(and(...conditions))
            .orderBy(asc(userMediaActivity.timestamp));
    }

    static async updateActivityEvent(userId: number, eventId: number, payload: {
        specificGained?: number;
        isCompleted?: boolean;
        isRedo?: boolean;
        timestamp?: string;
    }) {
        const updatePayload = Object.fromEntries(
            Object.entries(payload).filter(([, value]) => value !== undefined)
        );

        if (Object.keys(updatePayload).length === 0) return null;

        const [result] = await getDbClient()
            .update(userMediaActivity)
            .set(updatePayload)
            .where(and(
                eq(userMediaActivity.id, eventId),
                eq(userMediaActivity.userId, userId),
            ))
            .returning();

        return result ?? null;
    }

    static async deleteActivityEvent(userId: number, eventId: number) {
        await getDbClient()
            .delete(userMediaActivity)
            .where(and(
                eq(userMediaActivity.id, eventId),
                eq(userMediaActivity.userId, userId),
            ));
    }
}
