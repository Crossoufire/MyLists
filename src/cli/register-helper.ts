import {Command} from "commander";
import {TasksName} from "@/cli/commands";
import pinoLogger from "@/lib/server/core/pino-logger";
import {initializeContainer} from "@/lib/server/core/container";


interface RegisterTaskCommandParams {
    program: Command;
    taskName: TasksName;
    description: string;
    queuePayload?: Record<string, any>;
}


export function registerTaskCommand({ program, taskName, description }: RegisterTaskCommandParams) {
    program
        .command(taskName)
        .description(description)
        .option("-d, --direct", "Directly execute the task without using the queue")
        .action(async (options) => {
            const container = await initializeContainer();
            const directExecution: boolean = options.direct;
            const cliLogger = pinoLogger.child({ command: taskName });

            if (directExecution) {
                cliLogger.info(`Running ${taskName} task directly via CLI...`);
                try {
                    const taskService = container.services.tasks;
                    await taskService.runTask(taskName);
                    cliLogger.info(`Task ${taskName} completed directly via CLI.`);
                    process.exit(0);
                }
                catch (error) {
                    cliLogger.fatal({ err: error }, `Fatal error during direct ${taskName} execution in CLI`);
                    process.exit(1);
                }
            }
            else {
                cliLogger.info(`Enqueueing ${taskName} task via CLI...`);
                const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");
                try {
                    const job = await mylistsLongTaskQueue.add(taskName, { triggeredBy: "cron/cli" });
                    cliLogger.info({ jobId: job.id }, `Task ${taskName} enqueued successfully via CLI.`);
                    await mylistsLongTaskQueue.close();
                    process.exit(0);
                }
                catch (error) {
                    cliLogger.fatal({ err: error }, `Fatal error during ${taskName} enqueue in CLI`);
                    await mylistsLongTaskQueue.close();
                    process.exit(1);
                }
            }
        });
}
