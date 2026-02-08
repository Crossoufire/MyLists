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

    static async getMediaRefreshDailyCountsByType(days: number) {
        const startOffset = `-${Math.max(days - 1, 0)} day`;

        return getDbClient()
            .select({
                mediaType: mediaRefreshLog.mediaType,
                count: count(mediaRefreshLog.id).as("count"),
                date: sql<string>`date(${mediaRefreshLog.refreshedAt})`.as("date"),
            })
            .from(mediaRefreshLog)
            .where(gte(sql`date(${mediaRefreshLog.refreshedAt})`, sql`date('now', ${startOffset})`))
            .groupBy(sql`date(${mediaRefreshLog.refreshedAt})`, mediaRefreshLog.mediaType)
            .orderBy(sql`date(${mediaRefreshLog.refreshedAt})`);
    }

    static async getMediaRefreshTotalsByRole(days: number) {
        const startOffset = `-${Math.max(days - 1, 0)} day`;

        return getDbClient()
            .select({
                role: user.role,
                count: count(mediaRefreshLog.id).as("count"),
                userCount: countDistinct(mediaRefreshLog.userId).as("userCount"),
            })
            .from(mediaRefreshLog)
            .innerJoin(user, eq(user.id, mediaRefreshLog.userId))
            .where(gte(sql`date(${mediaRefreshLog.refreshedAt})`, sql`date('now', ${startOffset})`))
            .groupBy(user.role)
            .orderBy(desc(sql`count(${mediaRefreshLog.id})`));
    }

    static async getMediaRefreshTopUsers(days: number, limit: number) {
        const startOffset = `-${Math.max(days - 1, 0)} day`;
        const refreshCount = count(mediaRefreshLog.id).as("count");

        return getDbClient()
            .select({
                name: user.name,
                role: user.role,
                count: refreshCount,
                userId: mediaRefreshLog.userId,
            })
            .from(mediaRefreshLog)
            .innerJoin(user, eq(user.id, mediaRefreshLog.userId))
            .where(gte(sql`date(${mediaRefreshLog.refreshedAt})`, sql`date('now', ${startOffset})`))
            .groupBy(mediaRefreshLog.userId, user.name, user.role)
            .orderBy(desc(refreshCount))
            .limit(limit);
    }

    static async getRecentMediaRefreshes(limit: number) {
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
            .limit(limit);
    }
}
