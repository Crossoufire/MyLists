import pinoLogger from "@/lib/server/core/pino-logger";
import {createWorker, mylistsLongTaskQueue} from "@/lib/server/core/bullMQ-queue";


pinoLogger.info("Starting worker process...");

const worker = createWorker();

const shutdown = async () => {
    pinoLogger.info("Shutting down worker...");
    await worker.close();
    await mylistsLongTaskQueue.close();
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
