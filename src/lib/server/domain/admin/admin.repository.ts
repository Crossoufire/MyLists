import {MediaType} from "@/lib/utils/enums";
import {ErrorLog} from "@/lib/types/base.types";
import {SaveTaskToDb} from "@/lib/types/tasks.types";
import {SearchType} from "@/lib/types/zod.schema.types";
import {paginate} from "@/lib/server/database/pagination";
import {getDbClient} from "@/lib/server/database/async-storage";
import {count, countDistinct, desc, eq, gte, inArray, sql} from "drizzle-orm";
import {errorLogs, mediaRefreshLog, taskHistory, user} from "@/lib/server/database/schema";


export class AdminRepository {
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
