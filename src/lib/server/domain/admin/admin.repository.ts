import {ErrorLog} from "@/lib/types/base.types";
import {SaveTaskToDb} from "@/lib/types/tasks.types";
import {SearchType} from "@/lib/types/zod.schema.types";
import {MediaType, PrivacyType} from "@/lib/utils/enums";
import {getDbClient} from "@/lib/server/database/async-storage";
import {paginate, resolveSorting} from "@/lib/server/database/pagination";
import {asc, count, countDistinct, desc, eq, gte, inArray, like, or, sql} from "drizzle-orm";
import {collections, errorLogs, mediaRefreshLog, taskHistory, user} from "@/lib/server/database/schema";


export class AdminRepository {
    static async getCollectionsOverview() {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

        const result = getDbClient()
            .select({
                total: count(collections.id).as("total"),
                uniqueOwners: countDistinct(collections.ownerId).as("uniqueOwners"),
                totalViews: sql<number>`coalesce(sum(${collections.viewCount}), 0)`.as("totalViews"),
                totalLikes: sql<number>`coalesce(sum(${collections.likeCount}), 0)`.as("totalLikes"),
                totalCopies: sql<number>`coalesce(sum(${collections.copiedCount}), 0)`.as("totalCopies"),
                animeCount: sql<number>`sum(case when ${collections.mediaType} = ${MediaType.ANIME} then 1 else 0 end)`.as("animeCount"),
                booksCount: sql<number>`sum(case when ${collections.mediaType} = ${MediaType.BOOKS} then 1 else 0 end)`.as("booksCount"),
                gamesCount: sql<number>`sum(case when ${collections.mediaType} = ${MediaType.GAMES} then 1 else 0 end)`.as("gamesCount"),
                mangaCount: sql<number>`sum(case when ${collections.mediaType} = ${MediaType.MANGA} then 1 else 0 end)`.as("mangaCount"),
                publicCount: sql<number>`sum(case when ${collections.privacy} = ${PrivacyType.PUBLIC} then 1 else 0 end)`.as("publicCount"),
                seriesCount: sql<number>`sum(case when ${collections.mediaType} = ${MediaType.SERIES} then 1 else 0 end)`.as("seriesCount"),
                moviesCount: sql<number>`sum(case when ${collections.mediaType} = ${MediaType.MOVIES} then 1 else 0 end)`.as("moviesCount"),
                privateCount: sql<number>`sum(case when ${collections.privacy} = ${PrivacyType.PRIVATE} then 1 else 0 end)`.as("privateCount"),
                restrictedCount: sql<number>`sum(case when ${collections.privacy} = ${PrivacyType.RESTRICTED} then 1 else 0 end)`.as("restrictedCount"),
                createdThisMonth: sql<number>`sum(case when ${collections.createdAt} >= ${currentMonthStart} then 1 else 0 end)`.as("createdThisMonth"),
                createdPreviousMonth: sql<number>`sum(case 
                    when ${collections.createdAt} >= ${previousMonthStart} 
                    and ${collections.createdAt} < ${currentMonthStart} 
                    then 1 else 0 end
                )`.as("createdPreviousMonth"),
            })
            .from(collections)
            .get();

        return {
            total: result?.total ?? 0,
            totalViews: result?.totalViews ?? 0,
            totalLikes: result?.totalLikes ?? 0,
            totalCopies: result?.totalCopies ?? 0,
            uniqueOwners: result?.uniqueOwners ?? 0,
            createdThisMonth: result?.createdThisMonth ?? 0,
            createdPreviousMonth: result?.createdPreviousMonth ?? 0,
            collectionsPerPrivacy: [
                { privacy: PrivacyType.PUBLIC, count: result?.publicCount ?? 0 },
                { privacy: PrivacyType.PRIVATE, count: result?.privateCount ?? 0 },
                { privacy: PrivacyType.RESTRICTED, count: result?.restrictedCount ?? 0 },
            ],
            collectionsPerMediaType: [
                { mediaType: MediaType.SERIES, count: result?.seriesCount ?? 0 },
                { mediaType: MediaType.ANIME, count: result?.animeCount ?? 0 },
                { mediaType: MediaType.MOVIES, count: result?.moviesCount ?? 0 },
                { mediaType: MediaType.GAMES, count: result?.gamesCount ?? 0 },
                { mediaType: MediaType.BOOKS, count: result?.booksCount ?? 0 },
                { mediaType: MediaType.MANGA, count: result?.mangaCount ?? 0 },
            ],
        };
    }

    static async getCollectionsCreatedPerMonth() {
        const results = getDbClient()
            .all<{ month: string; count: number }>(sql`
                SELECT 
                    COUNT(*) as count,
                    strftime('%Y-%m', ${collections.createdAt}) as month
                FROM ${collections}
                GROUP BY strftime('%Y-%m', ${collections.createdAt})
                ORDER BY month ASC
            `);

        return results.map((row) => ({
            count: Number(row.count),
            month: new Date(`${row.month}-01T00:00:00.000Z`).toLocaleString("en-US", { month: "short", year: "numeric" }),
        }));
    }

    static async getPaginatedCollectionsForAdmin(data: SearchType) {
        const sortDesc = data.sortDesc ?? true;
        const search = data.search?.trim() ?? "";

        const allowedSorts = ["id", "title", "createdAt", "privacy", "mediaType", "viewCount", "likeCount", "copiedCount", "ownerName"] as const;
        const sorting = resolveSorting(data.sorting, allowedSorts, "createdAt");

        const searchCondition = search
            ? or(like(collections.title, `%${search}%`), like(user.name, `%${search}%`))
            : undefined;

        const orderColumn = (() => {
            switch (sorting) {
                case "id":
                    return collections.id;
                case "title":
                    return collections.title;
                case "privacy":
                    return collections.privacy;
                case "mediaType":
                    return collections.mediaType;
                case "viewCount":
                    return collections.viewCount;
                case "likeCount":
                    return collections.likeCount;
                case "copiedCount":
                    return collections.copiedCount;
                case "ownerName":
                    return user.name;
                case "createdAt":
                default:
                    return collections.createdAt;
            }
        })();

        return paginate({
            page: data.page,
            defaultPerPage: 12,
            perPage: data.perPage,
            getTotal: async () => {
                return getDbClient()
                    .select({ count: count() })
                    .from(collections)
                    .innerJoin(user, eq(user.id, collections.ownerId))
                    .where(searchCondition)
                    .get()?.count ?? 0;
            },
            getItems: ({ limit, offset }) => {
                const query = getDbClient()
                    .select({
                        ownerId: user.id,
                        ownerName: user.name,
                        ownerImage: user.image,
                        id: collections.id,
                        title: collections.title,
                        ordered: collections.ordered,
                        privacy: collections.privacy,
                        mediaType: collections.mediaType,
                        viewCount: collections.viewCount,
                        likeCount: collections.likeCount,
                        createdAt: collections.createdAt,
                        updatedAt: collections.updatedAt,
                        copiedCount: collections.copiedCount,
                        itemsCount: sql<number>`(
                            SELECT COUNT(*)
                            FROM collection_items
                            WHERE collection_items.collection_id = ${collections.id}
                        )`.as("itemsCount"),
                    })
                    .from(collections)
                    .innerJoin(user, eq(user.id, collections.ownerId))
                    .$dynamic();

                return (searchCondition ? query.where(searchCondition) : query)
                    .orderBy(sortDesc ? desc(orderColumn) : asc(orderColumn))
                    .offset(offset)
                    .limit(limit);
            },
        });
    }

    static async saveErrorToDb(error: ErrorLog) {
        await getDbClient()
            .insert(errorLogs)
            .values({
                name: error.name,
                stack: error.stack,
                message: error.message,
            });
    }

    static async getPaginatedErrorLogs(data: SearchType) {
        const { items, total, pages } = await paginate({
            page: data.page,
            perPage: data.perPage,
            getTotal: async () => {
                return getDbClient()
                    .select({ count: count() })
                    .from(errorLogs)
                    .get()?.count ?? 0;
            },
            getItems: ({ limit, offset }) => {
                return getDbClient()
                    .select()
                    .from(errorLogs)
                    .offset(offset)
                    .limit(limit)
                    .orderBy(desc(errorLogs.createdAt));
            },
        });

        return { items, total, pages };
    }

    static async deleteErrorLogs(errorIds: number[] | null) {
        if (errorIds) {
            await getDbClient()
                .delete(errorLogs)
                .where(inArray(errorLogs.id, errorIds));
        }
        else {
            await getDbClient()
                .delete(errorLogs);
        }
    }

    static async saveTaskToDb(data: SaveTaskToDb) {
        await getDbClient()
            .insert(taskHistory)
            .values({
                logs: data.logs,
                taskId: data.taskId,
                status: data.status,
                taskName: data.taskName,
                startedAt: data.startedAt,
                finishedAt: data.finishedAt,
                triggeredBy: data.triggeredBy,
                errorMessage: data.errorMessage ?? null,
                userId: "userId" in data ? data.userId : null,
            });
    }

    static async deleteArchivedTaskForAdmin(taskId: string) {
        await getDbClient()
            .delete(taskHistory)
            .where(eq(taskHistory.taskId, taskId));
    }

    static async getArchivedTasksForAdmin() {
        return getDbClient()
            .select()
            .from(taskHistory)
            .orderBy(desc(taskHistory.startedAt));
    }

    static async logMediaRefresh(params: { userId: number; mediaType: MediaType; apiId: number | string }) {
        await getDbClient()
            .insert(mediaRefreshLog)
            .values({
                userId: params.userId,
                mediaType: params.mediaType,
                apiId: String(params.apiId),
            });
    }

    static async getMediaRefreshDailyCountsByType(days?: number | null) {
        const dateFilter = this._buildMediaRefreshDateFilter(days);

        const query = getDbClient()
            .select({
                mediaType: mediaRefreshLog.mediaType,
                count: count(mediaRefreshLog.id).as("count"),
                date: sql<string>`date(${mediaRefreshLog.refreshedAt})`.as("date"),
            })
            .from(mediaRefreshLog)
            .$dynamic();

        return (dateFilter ? query.where(dateFilter) : query)
            .groupBy(sql`date(${mediaRefreshLog.refreshedAt})`, mediaRefreshLog.mediaType)
            .orderBy(sql`date(${mediaRefreshLog.refreshedAt})`);
    }

    static async getMediaRefreshTopUsers(days: number | null) {
        const dateFilter = this._buildMediaRefreshDateFilter(days);

        const query = getDbClient()
            .select({
                name: user.name,
                role: user.role,
                userId: mediaRefreshLog.userId,
                count: count(mediaRefreshLog.id).as("count"),
            })
            .from(mediaRefreshLog)
            .innerJoin(user, eq(user.id, mediaRefreshLog.userId))
            .$dynamic();

        return (dateFilter ? query.where(dateFilter) : query)
            .groupBy(mediaRefreshLog.userId, user.name, user.role)
            .orderBy(desc(count(mediaRefreshLog.id).as("count")))
            .limit(8);
    }

    static async getMediaRefreshTotalsByRole() {
        return getDbClient()
            .select({
                role: user.role,
                count: count(mediaRefreshLog.id).as("count"),
                userCount: countDistinct(mediaRefreshLog.userId).as("userCount"),
            })
            .from(mediaRefreshLog)
            .innerJoin(user, eq(user.id, mediaRefreshLog.userId))
            .groupBy(user.role)
            .orderBy(desc(sql`count(${mediaRefreshLog.id})`));
    }

    static async getMediaRefreshTotalsByType() {
        return getDbClient()
            .select({
                mediaType: mediaRefreshLog.mediaType,
                count: count(mediaRefreshLog.id).as("count"),
            })
            .from(mediaRefreshLog)
            .groupBy(mediaRefreshLog.mediaType)
            .orderBy(desc(count(mediaRefreshLog.id)));
    }

    static async getMediaRefreshSummary() {
        const [summary, busiestDay] = await Promise.all([
            getDbClient()
                .select({
                    total: count(mediaRefreshLog.id).as("total"),
                    uniqueUsers: countDistinct(mediaRefreshLog.userId).as("uniqueUsers"),
                    firstRefreshDate: sql<string | null>`min(date(${mediaRefreshLog.refreshedAt}))`.as("firstRefreshDate"),
                })
                .from(mediaRefreshLog)
                .get(),
            getDbClient()
                .select({
                    count: count(mediaRefreshLog.id).as("count"),
                    date: sql<string>`date(${mediaRefreshLog.refreshedAt})`.as("date"),
                })
                .from(mediaRefreshLog)
                .groupBy(sql`date(${mediaRefreshLog.refreshedAt})`)
                .orderBy(desc(sql`count(${mediaRefreshLog.id})`), desc(sql`date(${mediaRefreshLog.refreshedAt})`))
                .limit(1)
                .get(),
        ]);

        return {
            total: Number(summary?.total ?? 0),
            busiestDay: busiestDay?.date ?? "",
            busiestCount: Number(busiestDay?.count ?? 0),
            uniqueUsers: Number(summary?.uniqueUsers ?? 0),
            firstRefreshDate: summary?.firstRefreshDate ?? null,
        };
    }

    static async getRecentMediaRefreshes(page: number) {
        return paginate({
            page,
            maxPerPage: 30,
            defaultPerPage: 12,
            getTotal: async () => {
                return getDbClient()
                    .select({ count: count() })
                    .from(mediaRefreshLog)
                    .get()?.count ?? 0;
            },
            getItems: ({ limit, offset }) => {
                return getDbClient()
                    .select({
                        name: user.name,
                        role: user.role,
                        apiId: mediaRefreshLog.apiId,
                        userId: mediaRefreshLog.userId,
                        mediaType: mediaRefreshLog.mediaType,
                        refreshedAt: mediaRefreshLog.refreshedAt,
                    })
                    .from(mediaRefreshLog)
                    .innerJoin(user, eq(user.id, mediaRefreshLog.userId))
                    .orderBy(desc(mediaRefreshLog.refreshedAt))
                    .offset(offset)
                    .limit(limit);
            },
        });
    }

    private static _buildMediaRefreshDateFilter(days?: number | null) {
        if (!days) return undefined;

        const startOffset = `-${Math.max(days - 1, 0)} day`;
        return gte(sql`date(${mediaRefreshLog.refreshedAt})`, sql`date('now', ${startOffset})`);
    };
}
