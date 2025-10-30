import {serverEnv} from "@/env/server";
import {rootLogger} from "@/lib/server/core/logger";
import {getRedisConnection} from "@/lib/server/core/redis-client";
import {createOrGetQueue, createWorker, WORKER_LOCK_KEY} from "@/lib/server/core/bullmq/index";


startWorker();


async function startWorker() {
    if (!serverEnv.REDIS_ENABLED) {
        throw new Error("Redis is not enabled.");
    }

    rootLogger.info("Starting worker process...");

    try {
        const connection = await getRedisConnection();
        const queue = await createOrGetQueue();
        const worker = createWorker(connection);

        const shutdown = async () => {
            rootLogger.info("Shutting down worker...");
            await connection.del(WORKER_LOCK_KEY);
            await queue.close();
            await worker.close();
            await connection.quit();
            rootLogger.info("Worker shut down gracefully.");
            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        process.on("unhandledRejection", (reason, promise) => {
            rootLogger.fatal({ reason, promise }, "Unhandled Rejection at Worker");
        });

        process.on("uncaughtException", (error) => {
            rootLogger.fatal({ err: error }, "Uncaught Exception at Worker");
            process.exit(1);
        });

        rootLogger.info("Worker process started and listening for jobs.");
    }
    catch (error) {
        rootLogger.fatal({ err: error }, "A fatal error occurred during worker startup.");

        // If startup fails, try to release the lock just in case it was set
        const connection = await getRedisConnection();
        await connection.del(WORKER_LOCK_KEY);
        await connection.quit();

        process.exit(1);
    }
}
