import pinoLogger from "@/lib/server/core/pino-logger";
import {connectRedis} from "@/lib/server/core/redis-client";
import {createWorker, initializeQueue} from "@/lib/server/core/bullMQ-queue";


async function startWorker() {
    pinoLogger.info("Starting worker process...");

    try {
        // 1. Connect to Redis
        const redisConnection = await connectRedis({ bypassEnv: true });
        if (!redisConnection) {
            throw new Error("Worker failed to connect to Redis.");
        }
        pinoLogger.info("Redis connection established for worker.");

        // 2. Create the Worker and Initialize the Queue
        const worker = createWorker(redisConnection);
        const mylistsLongTaskQueue = initializeQueue(redisConnection);

        // 3. Setup graceful shutdown
        const shutdown = async () => {
            pinoLogger.info("Shutting down worker...");
            await worker.close();
            await mylistsLongTaskQueue.close();
            await redisConnection.quit();
            pinoLogger.info("Worker shut down gracefully.");
            process.exit(0);
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
        process.on("SIGHUP", shutdown);
        process.on("unhandledRejection", (reason, promise) => {
            pinoLogger.fatal({ reason, promise }, "Unhandled Rejection at Worker");
        });
        process.on("uncaughtException", (error) => {
            pinoLogger.fatal({ err: error }, "Uncaught Exception at Worker");
            process.exit(1);
        });

        pinoLogger.info("Worker process started and listening for jobs.");

    }
    catch (error) {
        pinoLogger.fatal({ err: error }, "A fatal error occurred during worker startup.");
        process.exit(1);
    }
}


startWorker();
