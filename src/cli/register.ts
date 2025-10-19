import {Command} from "commander";
import pinoLogger from "@/lib/server/core/pino-logger";
import {initializeQueue} from "@/lib/server/core/bullmq";
import {getContainer} from "@/lib/server/core/container";
import {connectRedis} from "@/lib/server/core/redis-client";
import {TaskDefinition, TaskJobData} from "@/lib/types/tasks.types";


export const registerTaskCommand = (program: Command, task: TaskDefinition) => {
    const command = program
        .command(task.name)
        .description(task.description)
        .option("-d, --direct", "Directly execute the task without using the queue")

    if ("options" in task && task.options) {
        task.options.forEach((opt) => command.requiredOption(opt.flags, opt.description));
    }

    command.action(async (options) => {
        const { direct: directExecution, ...taskArgs } = options;
        const cliLogger = pinoLogger.child({ command: task.name });
        const jobData: TaskJobData = { ...taskArgs, triggeredBy: "cron/cli" };

        const container = await getContainer({ tasksServiceLogger: pinoLogger });
        const taskService = container.services.tasks;

        if (directExecution) {
            cliLogger.info(`Running ${task.name} task directly via CLI...`);
            try {
                await taskService.runTask(task.name, jobData);
                cliLogger.info(`Task ${task.name} completed directly via CLI.`);
            }
            catch (error) {
                cliLogger.fatal({ err: error }, `Fatal error during direct ${task.name} execution in CLI`);
                process.exit(1);
            }
        }
        else {
            cliLogger.info(`Enqueueing ${task.name} task via CLI...`);

            const redisConnection = await connectRedis();
            if (!redisConnection) {
                cliLogger.fatal("Failed to connect to Redis from CLI.");
                process.exit(1);
            }

            const mylistsTaskQueue = initializeQueue(redisConnection);
            try {
                const job = await mylistsTaskQueue.add(task.name, jobData);
                cliLogger.info({ jobId: job.id }, `Task ${task.name} enqueued successfully via CLI.`);
            }
            catch (error) {
                cliLogger.fatal({ err: error }, `Fatal error during ${task.name} enqueue in CLI`);
                process.exit(1);
            }
            finally {
                await mylistsTaskQueue.close();
                await redisConnection.quit();
            }
        }
    });
};
