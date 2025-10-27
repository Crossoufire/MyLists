import {Command} from "commander";
import {initializeQueue} from "@/lib/server/core/bullmq";
import {createTaskLogger, rootLogger} from "@/lib/server/core/logger";
import {TaskContext, TaskDefinition, TaskJobData} from "@/lib/types/tasks.types";
import {executeTask} from "@/lib/server/core/task-runner";


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
        const cliLogger = rootLogger.child({ command: task.name });
        const jobData: TaskJobData = { ...taskArgs, triggeredBy: "cron/cli" };

        if (directExecution) {
            cliLogger.info(`Running ${task.name} task directly via CLI...`);
            try {
                const taskLogger = createTaskLogger({ taskName: task.name, ...jobData });

                const context: TaskContext = {
                    data: jobData,
                    taskName: task.name,
                    triggeredBy: jobData.triggeredBy,
                }

                await executeTask(context, taskLogger);
                cliLogger.info(`Task ${task.name} completed directly via CLI.`);
            }
            catch (error) {
                cliLogger.fatal({ err: error }, `Fatal error during direct ${task.name} execution in CLI`);
                process.exit(1);
            }
        }
        else {
            cliLogger.info(`Enqueueing ${task.name} task via CLI...`);

            const { connectRedis } = await import("@/lib/server/core/redis-client");

            const redisConnection = await connectRedis();
            if (!redisConnection) {
                cliLogger.fatal("Failed to connect to Redis from CLI.");
                process.exit(1);
            }

            const queue = initializeQueue(redisConnection);
            try {
                const job = await queue.add(task.name, jobData);
                cliLogger.info({ jobId: job.id }, `Task ${task.name} enqueued successfully via CLI.`);
            }
            catch (error) {
                cliLogger.fatal({ err: error }, `Fatal error during ${task.name} enqueue in CLI`);
                process.exit(1);
            }
            finally {
                await queue.close();
                await redisConnection.quit();
            }
        }
    });
};