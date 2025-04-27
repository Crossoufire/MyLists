import {Keyv} from "keyv";
import KeyvRedis from "@keyv/redis";
import {createCache} from "cache-manager";
import {connectRedis} from "@/lib/server/core/redis-client";


const DEFAULT_TTL_MS = 5 * 60 * 1000;


export async function initializeCache() {
    let cache;
    const nodeEnv = process.env.NODE_ENV;

    if (nodeEnv === "production") {
        console.log("Initializing Redis cache for production...");
        try {
            const redisInstance = await connectRedis();
            console.log("Redis connection established");

            const redisKeyvStore = new KeyvRedis(redisInstance!);
            const keyvInstance = new Keyv({ store: redisKeyvStore });
            cache = createCache({ stores: [keyvInstance], ttl: DEFAULT_TTL_MS });

            console.log("Redis cache store initialized via cache-manager");
        }
        catch (error) {
            console.error("FATAL: Failed to initialize Redis cache store", error);
            throw new Error("Redis cache initialization failed");
        }
    }
    else {
        console.log(`Initializing in-memory cache for dev`);
        const memoryKeyv = new Keyv();
        cache = createCache({ stores: [memoryKeyv], ttl: DEFAULT_TTL_MS });
        console.log("In-memory cache initialized via cache-manager");
    }

    return cache;
}


export const cacheManager = await initializeCache();
