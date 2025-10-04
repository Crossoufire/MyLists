import {Keyv} from "keyv";
import KeyvRedis from "@keyv/redis";
import {serverEnv} from "@/env/server";
import {createCache} from "cache-manager";


const DEFAULT_TTL_MS = 5 * 60 * 1000;


export async function initCacheManager() {
    let cache;

    if (process.env.NODE_ENV === "production") {
        try {
            const redisKeyvStore = new KeyvRedis(serverEnv.REDIS_URL);
            const keyvInstance = new Keyv({ store: redisKeyvStore });
            cache = createCache({ stores: [keyvInstance], ttl: DEFAULT_TTL_MS });
            console.log(`Redis cache store initialized via cache-manager. Default TTL: ${DEFAULT_TTL_MS / 1000}s`);
        }
        catch (err) {
            console.error("FATAL: Failed to initialize Redis cache store", err);
            throw new Error("Redis cache initialization failed");
        }
    }
    else {
        const memoryKeyv = new Keyv();
        cache = createCache({ stores: [memoryKeyv], ttl: DEFAULT_TTL_MS });
        console.log(`In-memory cache initialized via cache-manager. Default TTL: ${DEFAULT_TTL_MS / 1000}s`);
    }

    return cache;
}
