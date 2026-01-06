import {ErrorLog} from "@/lib/types/base.types";
import {count, desc, eq, inArray} from "drizzle-orm";
import {SaveTaskToDb} from "@/lib/types/tasks.types";
import {SearchTypeAdmin} from "@/lib/types/zod.schema.types";
import {getDbClient} from "@/lib/server/database/async-storage";
import {errorLogs, taskHistory, userMediaStatsHistory} from "@/lib/server/database/schema";


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

    static async getPaginatedErrorLogs(data: SearchTypeAdmin) {
        const page = data.page ?? 1;
        const perPage = data.perPage ?? 10;
        const offset = (page - 1) * perPage;

        const totalLogs = await getDbClient()
            .select({ count: count() })
            .from(errorLogs)
            .get().then((res) => res?.count ?? 0);

        const logs = await getDbClient()
            .select()
            .from(errorLogs)
            .offset(offset)
            .limit(perPage)
            .orderBy(desc(errorLogs.createdAt));

        return {
            items: logs,
            total: totalLogs,
            pages: Math.ceil(totalLogs / perPage),
        };
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

    static async getAdminUserTracking(userId: number) {
        return getDbClient()
            .select()
            .from(userMediaStatsHistory)
            .where(eq(userMediaStatsHistory.userId, userId))
    }
}
