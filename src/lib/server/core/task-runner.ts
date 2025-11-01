import {getContainer} from "@/lib/server/core/container";
import {taskHistory} from "@/lib/server/database/schema";
import {createCapturingLogger} from "@/lib/server/core/logger";
import {getDbClient} from "@/lib/server/database/async-storage";
import {LogTask, TaskData, TaskName} from "@/lib/types/tasks.types";


export async function executeTask(taskData: TaskData) {
    const container = await getContainer();
    const tasksService = container.services.tasks;

    const { logger, getLogs } = createCapturingLogger(taskData);

    const startedAt = new Date();
    let errorMessage: string | null = null;
    let status: "completed" | "failed" = "completed";

    const taskLogger = logger.child({ command: taskData.taskName });
    taskLogger.info(`Running ${taskData.taskName} task via ${taskData.triggeredBy}...`);

    try {
        await tasksService.runTask({ data: taskData, logger: taskLogger });
        taskLogger.info(`Task ${taskData.taskName} completed via ${taskData.triggeredBy}...`);
    }
    catch (err) {
        status = "failed";
        errorMessage = err instanceof Error ? err.message : String(err);
        taskLogger.error({ err: err }, `Task ${taskData.taskName} failed.`);

        throw err;
    }
    finally {
        const finishedAt = new Date();
        const capturedLogs = getLogs();

        await saveJobToDb({
            status,
            startedAt,
            finishedAt,
            errorMessage,
            logs: capturedLogs,
            ...taskData,
        });
    }
}


interface SaveToDbProps {
    taskId: string,
    logs: LogTask[],
    startedAt: Date,
    userId?: number,
    finishedAt: Date,
    taskName: TaskName,
    errorMessage: string | null,
    status: "completed" | "failed";
    triggeredBy: "user" | "cron/cli" | "dashboard",
}


export const saveJobToDb = async (data: SaveToDbProps) => {
    try {
        await getDbClient()
            .insert(taskHistory)
            .values({
                // @ts-expect-error: No idea what is going on, drizzle bug?
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
