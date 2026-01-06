import {z} from "zod";
import {randomUUID} from "node:crypto";
import {getContainer} from "@/lib/server/core/container";
import {getTask, TaskName} from "@/lib/server/tasks/registry";
import {TaskStatus, TaskTrigger} from "@/lib/types/tasks.types";
import {createCapturingLogger} from "@/lib/server/core/pino-logger";


type RunTaskOptions<T extends TaskName> = {
    taskName: T;
    stdoutAsJson?: boolean;
    triggeredBy: TaskTrigger;
    input: z.infer<(typeof import("@/lib/server/tasks/registry"))["taskRegistry"][T]["inputSchema"]>;
};


export const runTask = async <T extends TaskName>(options: RunTaskOptions<T>) => {
    const { taskName, input, triggeredBy, stdoutAsJson } = options;

    const taskId = randomUUID();
    const task = getTask(taskName);
    const container = await getContainer();
    const adminService = container.services.admin;

    const { logger, getLogs } = createCapturingLogger({ taskId, taskName, triggeredBy, stdoutAsJson });
    const taskLogger = logger.child({ taskName });

    let status: TaskStatus = "completed";
    let errorMessage: string | null = null;
    const startedAt = new Date().toISOString();

    try {
        // Validate input against schema
        const inputResult = task.inputSchema.safeParse(input);
        if (!inputResult.success) {
            throw new Error(`Invalid input for task ${taskName}: ${inputResult.error.message}`);
        }

        taskLogger.info({ json: { input: inputResult.data } }, `Starting task via ${triggeredBy}`);

        const startTime = Date.now();

        // Input already validated against schema, safe to cast
        await task.handler({ input: inputResult.data as any, logger: taskLogger, triggeredBy, taskId });

        taskLogger.info({ json: { durationMs: (Date.now() - startTime) } }, "Task completed");
    }
    catch (err) {
        status = "failed";
        taskLogger.error({ json: err }, `Task failed`);
        errorMessage = err instanceof Error ? err.message : String(err);

        throw err;
    }
    finally {
        await adminService.saveTaskToDb({
            taskId,
            status,
            taskName,
            startedAt,
            triggeredBy,
            errorMessage,
            logs: getLogs(),
            finishedAt: new Date().toISOString(),
        });
    }
};
