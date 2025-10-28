import pino from "pino";
import {TaskContext} from "@/lib/types/tasks.types";
import {getContainer} from "@/lib/server/core/container";


export async function executeTask(context: TaskContext, logger: pino.Logger) {
    const container = await getContainer({ tasksServiceLogger: logger });
    const tasksService = container.services.tasks;
    await tasksService.runTask(context);
}
