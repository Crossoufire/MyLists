import {Command} from "commander";
import {TaskDefinition} from "@/lib/types/tasks.types";
import {executeTask} from "@/lib/server/core/task-runner";
import {randomUUID} from "node:crypto";


export const registerTaskCommand = (program: Command, task: TaskDefinition) => {
    const command = program
        .command(task.name)
        .description(task.description)

    if ("options" in task && task.options) {
        task.options.forEach((opt) => command.requiredOption(opt.flags, opt.description));
    }

    command.action(async (options) => {
        await executeTask({
            taskName: task.name,
            taskId: randomUUID(),
            triggeredBy: "cron/cli",
            ...options,
        });
        process.exit(0);
    });
};
