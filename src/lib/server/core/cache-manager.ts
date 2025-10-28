import {Keyv} from "keyv";
import KeyvRedis from "@keyv/redis";
import {serverEnv} from "@/env/server";
import {createCache} from "cache-manager";


export async function initCacheManager() {
    let cache;

    const cache_ttl_ms = serverEnv.CACHE_TTL_MIN * 60 * 1000;

    if (!serverEnv.REDIS_ENABLED) {
        const memoryKeyv = new Keyv();
        cache = createCache({ stores: [memoryKeyv], ttl: cache_ttl_ms });
        console.log(`In-memory cache init via cache-manager. Default TTL: ${cache_ttl_ms / 1000}s`);
    }
    else {
        try {
            const redisKeyvStore = new KeyvRedis(serverEnv.REDIS_URL);
            const keyvInstance = new Keyv({ store: redisKeyvStore });
            cache = createCache({ stores: [keyvInstance], ttl: cache_ttl_ms });
            console.log(`Redis cache init via cache-manager. Default TTL: ${cache_ttl_ms / 1000}s`);
        }
        catch {
            throw new Error("Redis cache init failed. Please check your Redis connection.");
        }
    }

    return cache;
}
