import {FormattedError} from "@/lib/utils/error-classes";
import {createServerOnlyFn} from "@tanstack/react-start";


export const getQueue = createServerOnlyFn(() => async () => {
    const { connectRedis } = await import("@/lib/server/core/redis-client");
    const { mylistsTaskQueue, initializeQueue } = await import("@/lib/server/core/bullmq");

    if (mylistsTaskQueue) {
        return mylistsTaskQueue;
    }

    const redisConnection = await connectRedis();
    if (!redisConnection) {
        throw new FormattedError("Could not connect to Redis for queue operations.");
    }

    return initializeQueue(redisConnection);
})();


const getCancelKey = (jobId: string) => {
    return `mylists-cancel:${jobId}`;
};


export const signalJobCancellation = async (jobId: string) => {
    const { connectRedis } = await import("@/lib/server/core/redis-client");

    const redisConnection = await connectRedis();
    if (!redisConnection) {
        throw new Error("Failed to connect to Redis.");
    }

    await redisConnection.set(getCancelKey(jobId), "1", "EX", 3600);
};


export const isJobCancelled = async (jobId: string) => {
    const { connectRedis } = await import("@/lib/server/core/redis-client");

    const redisConnection = await connectRedis();
    if (!redisConnection) {
        throw new Error("Failed to connect to Redis.");
    }

    const result = await redisConnection.get(getCancelKey(jobId));

    return result === "1";
};
