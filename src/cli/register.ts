import {Command} from "commander";
import {randomUUID} from "node:crypto";
import {TaskDefinition} from "@/lib/types/tasks.types";
import {executeTask} from "@/lib/server/core/task-runner";


export const registerTaskCommand = (program: Command, task: TaskDefinition) => {
    const command = program
        .command(task.name)
        .description(task.description)
        .option("-j, --json", "Print logs to stdout as JSON")

    if ("options" in task && task.options) {
        task.options.forEach((opt) => command.requiredOption(opt.flags, opt.description));
    }

    command.action(async (options) => {
        await executeTask({
            taskName: task.name,
            taskId: randomUUID(),
            userId: options.userId,
            triggeredBy: "cron/cli",
            filePath: options.filePath,
            stdoutAsJson: options.json,
        });
        process.exit(0);
    });
};
