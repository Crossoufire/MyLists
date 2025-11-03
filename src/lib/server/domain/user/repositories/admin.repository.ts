import {desc, eq} from "drizzle-orm";
import {SaveToDbProps} from "@/lib/types/tasks.types";
import {taskHistory} from "@/lib/server/database/schema";
import {getDbClient} from "@/lib/server/database/async-storage";


export class AdminRepository {
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
