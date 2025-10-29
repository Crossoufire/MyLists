import {TaskContext} from "@/lib/types/tasks.types";
import {getContainer} from "@/lib/server/core/container";


export async function executeTask(context: TaskContext) {
    const container = await getContainer();
    const tasksService = container.services.tasks;

    await tasksService.runTask(context);
}
