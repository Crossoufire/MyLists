import {createServerOnlyFn} from "@tanstack/react-start";
import {FormattedError} from "@/lib/utils/error-classes";


export const getQueue = createServerOnlyFn(() => async () => {
    if (process.env.NODE_ENV !== "production") {
        return null;
    }

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
