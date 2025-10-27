import {rootLogger} from "@/lib/server/core/logger";
import {createWorker, initializeQueue} from "@/lib/server/core/bullmq/index";


async function startWorker() {
    rootLogger.info("Starting worker process...");

    try {
        const { connectRedis } = await import("@/lib/server/core/redis-client");

        // Connect to Redis
        const redisConnection = await connectRedis();
        if (!redisConnection) {
            throw new Error("Worker failed to connect to Redis.");
        }
        rootLogger.info("Redis connection established for worker.");

        // Create worker and init Queue
        const worker = createWorker(redisConnection);
        const queue = initializeQueue(redisConnection);

        // Setup shutdown
        const shutdown = async () => {
            rootLogger.info("Shutting down worker...");
            await queue.close();
            await worker.close();
            await redisConnection.quit();
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


startWorker();
