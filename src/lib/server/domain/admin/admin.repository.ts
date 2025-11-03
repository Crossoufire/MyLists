import {desc, eq} from "drizzle-orm";
import {ErrorLog} from "@/lib/types/base.types";
import {SaveToDbProps} from "@/lib/types/tasks.types";
import {getDbClient} from "@/lib/server/database/async-storage";
import {errorLogs, taskHistory} from "@/lib/server/database/schema";


export class AdminRepository {
    static async saveErrorToDb(error: ErrorLog) {
        await getDbClient()
            .insert(errorLogs)
            .values({
                name: error.name,
                message: error.message,
                stack: error.stack ?? null,
            })
            .execute();
    }

    static async getErrorLogs() {
        return getDbClient()
            .select()
            .from(errorLogs)
            .orderBy(desc(errorLogs.createdAt));
    }

    static async deleteErrorLog(errorId: number) {
        await getDbClient()
            .delete(errorLogs)
            .where(eq(errorLogs.id, errorId))
            .execute();
    }

    static async saveTaskToDb(data: SaveToDbProps) {
        try {
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
                })
                .execute();
        }
        catch (err) {
            console.error("Failed to save job to database:", err);
        }
    }

    static async deleteArchivedTaskForAdmin(taskId: string) {
        await getDbClient()
            .delete(taskHistory)
            .where(eq(taskHistory.taskId, taskId))
            .execute();
    }

    static async getArchivedTasksForAdmin() {
        return getDbClient()
            .select()
            .from(taskHistory)
            .orderBy(desc(taskHistory.startedAt));
    }
}
