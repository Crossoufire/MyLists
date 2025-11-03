import {TaskData} from "@/lib/types/tasks.types";
import {getContainer} from "@/lib/server/core/container";
import {createCapturingLogger} from "@/lib/server/core/logger";


export async function executeTask(taskData: TaskData) {
    const container = await getContainer();
    const tasksService = container.services.tasks;
    const adminService = container.services.admin;

    const { logger, getLogs } = createCapturingLogger(taskData);

    let errorMessage: string | null = null;
    const startedAt = new Date().toISOString();
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
        const capturedLogs = getLogs();
        const finishedAt = new Date().toISOString();

        await adminService.saveTaskToDb({
            status,
            startedAt,
            finishedAt,
            errorMessage,
            logs: capturedLogs,
            ...taskData,
        });
    }
}
