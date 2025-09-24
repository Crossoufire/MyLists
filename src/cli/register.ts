import {Command} from "commander";
import {TasksName} from "@/lib/types/base.types";
import pinoLogger from "@/lib/server/core/pino-logger";
import {getContainer} from "@/lib/server/core/container";
import {initializeQueue} from "@/lib/server/core/bullmq";
import {connectRedis} from "@/lib/server/core/redis-client";


export const registerTaskCommand = (program: Command, taskName: TasksName, description: string) => {
    program
        .command(taskName)
        .description(description)
        .option("-d, --direct", "Directly execute the task without using the queue")
        .action(async (options) => {
            const directExecution: boolean = options.direct;
            const cliLogger = pinoLogger.child({ command: taskName });
            const container = await getContainer({ tasksServiceLogger: pinoLogger });

            if (directExecution) {
                cliLogger.info(`Running ${taskName} task directly via CLI...`);
                try {
                    const taskService = container.services.tasks;
                    await taskService.runTask(taskName);
                    cliLogger.info(`Task ${taskName} completed directly via CLI.`);
                }
                catch (error) {
                    cliLogger.fatal({ err: error }, `Fatal error during direct ${taskName} execution in CLI`);
                    process.exit(1);
                }
            }
            else {
                cliLogger.info(`Enqueueing ${taskName} task via CLI...`);

                const redisConnection = await connectRedis();
                if (!redisConnection) {
                    cliLogger.fatal("Failed to connect to Redis from CLI.");
                    process.exit(1);
                }

                const mylistsLongTaskQueue = initializeQueue(redisConnection);

                try {
                    const job = await mylistsLongTaskQueue.add(taskName, { triggeredBy: "cron/cli" });
                    cliLogger.info({ jobId: job.id }, `Task ${taskName} enqueued successfully via CLI.`);
                }
                catch (error) {
                    cliLogger.fatal({ err: error }, `Fatal error during ${taskName} enqueue in CLI`);
                    process.exit(1);
                }
                finally {
                    await mylistsLongTaskQueue.close();
                    await redisConnection.quit();
                }
            }
        });
};
