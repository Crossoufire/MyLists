import {Command} from "commander";
import {createOrGetQueue} from "@/lib/server/core/bullmq";
import {executeTask} from "@/lib/server/core/task-runner";
import {getRedisConnection} from "@/lib/server/core/redis-client";
import {createTaskLogger, rootLogger} from "@/lib/server/core/logger";
import {TaskContext, TaskDefinition, TaskJobData} from "@/lib/types/tasks.types";


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
                    logger: taskLogger,
                    taskName: task.name,
                    triggeredBy: jobData.triggeredBy,
                }

                await executeTask(context);
                cliLogger.info(`Task ${task.name} completed directly via CLI.`);
            }
            catch (error) {
                cliLogger.fatal({ err: error }, `Fatal error during direct ${task.name} execution in CLI`);
                process.exit(1);
            }
        }
        else {
            cliLogger.info(`Enqueueing ${task.name} task via CLI...`);

            const queue = await createOrGetQueue();
            const connection = await getRedisConnection();
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
                await connection.quit();
                process.exit(0);
            }
        }
    });
};
