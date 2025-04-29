import {Command} from "commander";
import pinoLogger from "@/lib/server/core/pino-logger";
import {initializeContainer} from "@/lib/server/core/container";


export function registerBulkMediaRefreshCommand(program: Command) {
    program
        .command("bulkMediaRefresh")
        .description("Bulk refresh media data from APIs provider")
        .option("-d, --direct", "Directly execute the task without using the queue")
        .action(async (options) => {
            const directExecution = options.direct;
            const container = await initializeContainer();

            const cliLogger = pinoLogger.child({ command: "bulkMediaRefresh" });

            if (directExecution) {
                cliLogger.info("Running `bulkMediaRefresh` task directly via CLI...");
                try {
                    const taskService = container.services.tasks;
                    await taskService.runTask("bulkMediaRefresh");
                    cliLogger.info("Task `bulkMediaRefresh` completed directly via CLI.");
                    process.exit(0);
                }
                catch (error) {
                    cliLogger.fatal({ err: error }, "Fatal error during direct `bulkMediaRefresh` execution in CLI");
                    process.exit(1);
                }
            }
            else {
                cliLogger.info("Enqueueing `bulkMediaRefresh` task via CLI...");

                const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");

                try {
                    const job = await mylistsLongTaskQueue.add("bulkMediaRefresh", { triggeredBy: "cron" });
                    cliLogger.info({ jobId: job.id }, "Task `bulkMediaRefresh` enqueued successfully via CLI.");
                    await mylistsLongTaskQueue.close();
                    process.exit(0);
                }
                catch (error) {
                    cliLogger.fatal({ err: error }, "Fatal error during `bulkMediaRefresh` enqueue in CLI");
                    await mylistsLongTaskQueue.close();
                    process.exit(1);
                }
            }
        });
}
