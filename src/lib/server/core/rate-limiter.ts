import {connectRedis} from "@/lib/server/core/redis-client";
import {IRateLimiterOptions, RateLimiterMemory, RateLimiterRedis} from "rate-limiter-flexible";


export const createRateLimiter = async (options: Partial<IRateLimiterOptions>) => {
    const nodeEnv = process.env.NODE_ENV;

    if (nodeEnv === "production") {
        try {
            const redisInstance = await connectRedis();

            console.log(`Creating Redis rate limiter with options:`, options);
            return new RateLimiterRedis({
                ...options,
                storeClient: redisInstance,
            });
        }
        catch (error) {
            console.error("Error during Redis connection or limiter creation:", error);
            throw error;
        }
    }
    else {
        console.log(`Creating In-Memory rate limiter with options:`, options);
        return new RateLimiterMemory(options);
    }
};
