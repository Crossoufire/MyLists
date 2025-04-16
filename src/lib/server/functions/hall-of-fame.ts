import {db} from "@/lib/server/database/db";
import {alias} from "drizzle-orm/sqlite-core";
import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {and, eq, gt, inArray, ne, sql} from "drizzle-orm";
import {user, userMediaSettings} from "@/lib/server/database/schema";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getHallOfFame = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data, context: { currentUser } }) => {
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
        const normalizedScoreColumns: Record<string, any> = {};
        mediaTypes.forEach((mt) => normalizedScoreColumns[`${mt}Score`] = sql<number>`sum(
                CASE
                    WHEN ${umsAlias.mediaType} = ${mt} AND ${umsAlias.active} = 1 AND ${maxTimePerMedia.maxTime} > 0
                    THEN CAST(${umsAlias.timeSpent} AS REAL) / ${maxTimePerMedia.maxTime}
                ELSE 0
            END)`.as(`${mt}_score`));

        // Construct sum expression for total_score dynamically
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

        // Ranking CTE using Window Functions
        const rankColumns: Record<string, any> = {};
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
        let rankSelectionColName;
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

        const totalResult = await totalCounter.get();
        const total = totalResult?.count ?? 0;
        const pages = Math.ceil(total / perPage);
        const offset = (page - 1) * perPage;

        // Execute Final Paginated Query
        const rankedUsers = await finalQueryBase
            .orderBy(orderByColumn)
            .limit(perPage)
            .offset(offset)
            .execute();

        const userIds = rankedUsers.map((u) => u.id);
        const userSettingsMap = new Map<number, (typeof userMediaSettings.$inferSelect)[]>();

        if (userIds.length > 0) {
            const allSettings = await db
                .select()
                .from(userMediaSettings)
                .where(inArray(userMediaSettings.userId, userIds))
                .execute();

            for (const setting of allSettings) {
                if (!userSettingsMap.has(setting.userId)) {
                    userSettingsMap.set(setting.userId, []);
                }
                userSettingsMap.get(setting.userId)!.push(setting);
            }
        }

        // Get Media Type Counts (Active Users with Time Spent > 0)
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
            if (row.mediaType) mediaTypeCountMap.set(row.mediaType, row.activeUsers);
        });

        // Get Current User's Ranks
        let currentUserRankData: any;
        if (currentUser) {
            currentUserRankData = await db
                .with(allUsersRanked)
                .select()
                .from(allUsersRanked)
                .where(eq(allUsersRanked.id, parseInt(currentUser.id)))
                .get();
        }

        // Get Current User's Active Media Settings
        let currentUserActiveSettings = new Set<MediaType>();
        if (currentUser) {
            const settings = await db
                .select({ mediaType: userMediaSettings.mediaType })
                .from(userMediaSettings)
                .where(and(eq(userMediaSettings.userId, parseInt(currentUser.id)), eq(userMediaSettings.active, true)))
                .execute();
            currentUserActiveSettings = new Set(settings.map((s) => s.mediaType));
        }

        // Calculate Current User's Percentile Ranks
        const userRanks = [];
        if (currentUserRankData) {
            for (const mediaType of mediaTypes) {
                const rankKey = `${mediaType}Rank` as keyof typeof currentUserRankData;
                const rank = (currentUserRankData[rankKey] as number) ?? null;
                const mtCount = mediaTypeCountMap.get(mediaType) ?? 0;
                const active = currentUserActiveSettings.has(mediaType);
                let percent: number | null = null;

                if (rank !== null && active) {
                    if (mtCount === 0) {
                        percent = null;
                    }
                    else if (mtCount === 1 && rank === 1) {
                        percent = 100;
                    }
                    else if (rank > mtCount) {
                        percent = null;
                    }
                    else {
                        percent = (rank / mtCount) * 100;
                    }
                }

                userRanks.push({
                    rank,
                    active,
                    mediaType,
                    percent: percent !== null ? Math.round(percent * 100) / 100 : null,
                });
            }
        }

        // Format Final Results
        const items = rankedUsers.map((row) => {
            const settings = userSettingsMap.get(row.id) ?? [];
            return {
                settings,
                id: row.id,
                name: row.name,
                image: row.image,
                totalTime: row.totalTime,
                rank: (row[rankSelectionColName as keyof typeof row] as number) ?? null,
            }
        });

        return { items, page, pages, total, userRanks };
    });
