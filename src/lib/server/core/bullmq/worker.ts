import {serverEnv} from "@/env/server";
import {rootLogger} from "@/lib/server/core/logger";
import {getRedisConnection} from "@/lib/server/core/redis-client";
import {createOrGetQueue, createWorker} from "@/lib/server/core/bullmq/index";


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

        // Setup shutdown
        const shutdown = async () => {
            rootLogger.info("Shutting down worker...");
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
        process.exit(1);
    }
}
