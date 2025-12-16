import {serverEnv} from "@/env/server";
import {getRedisConnection} from "@/lib/server/core/redis-client";
import {IRateLimiterOptions, RateLimiterMemory, RateLimiterRedis} from "rate-limiter-flexible";


export const createRateLimiter = async (options: Partial<IRateLimiterOptions>) => {
    if (serverEnv.REDIS_ENABLED) {
        try {
            const connection = await getRedisConnection();
            console.log(`Creating Redis rate limiter with options:`, options);
            return new RateLimiterRedis({ ...options, storeClient: connection });
        }
        catch (err) {
            throw new Error(`Failed to create rate limiter: ${err}`);
        }
    }
    else {
        console.log(`Creating In-Memory rate limiter with options:`, options);
        return new RateLimiterMemory(options);
    }
};
