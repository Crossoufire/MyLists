import {Command} from "commander";
import pinoLogger from "@/lib/server/core/pino-logger";
import {getContainer} from "@/lib/server/core/container";


export function registerBulkMediaRefreshCommand(program: Command) {
    program
        .command("bulkMediaRefresh")
        .description("Bulk refresh media data from APIs provider")
        .action(async () => {
            const cliLogger = pinoLogger.child({ command: "bulkMediaRefresh" });
            cliLogger.info("Starting `bulkMediaRefresh` task via CLI...");

            try {
                const taskService = getContainer().services.tasks;
                await taskService.runTask("bulkMediaRefresh");
                cliLogger.info("Task `bulkMediaRefresh` completed via CLI.");
                process.exit(0);
            }
            catch (error) {
                cliLogger.fatal({ err: error }, "Fatal error during `bulkMediaRefresh` execution in CLI");
                process.exit(1);
            }
        });
}
