import Redis from "ioredis";
import {serverEnv} from "@/env/server";
import {getRedisConnection} from "@/lib/server/core/redis-client";


interface CacheStore {
    getStoreType(): string;
    del(key: string): Promise<void>;
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    wrap<T>(key: string, fn: () => Promise<T>, options?: { ttl?: number }): Promise<T>;
}


class RedisCacheStore implements CacheStore {
    constructor(
        private redis: Redis,
        private defaultTtl: number,
    ) {
    }

    async get<T>(key: string): Promise<T | undefined> {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : undefined;
    }

    async set(key: string, value: any, ttl?: number) {
        const ttlMs = ttl ?? this.defaultTtl;
        await this.redis.set(key, JSON.stringify(value), "PX", ttlMs);
    }

    async del(key: string) {
        await this.redis.del(key);
    }

    async wrap<T>(key: string, fn: () => Promise<T>, options?: { ttl?: number }): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== undefined) {
            return cached;
        }

        const result = await fn();
        await this.set(key, result, options?.ttl);

        return result;
    }

    getStoreType(): string {
        return "Redis";
    }
}


class MemoryCacheStore implements CacheStore {
    private cache = new Map<string, { value: any; expires: number }>();

    constructor(private defaultTtl: number) {
    }

    async get<T>(key: string): Promise<T | undefined> {
        const cached = this.cache.get(key);

        if (cached && cached.expires > Date.now()) {
            return cached.value;
        }

        if (cached) {
            this.cache.delete(key);
        }

        return undefined;
    }

    async set(key: string, value: any, ttl?: number) {
        const ttlMs = ttl ?? this.defaultTtl;
        this.cache.set(key, { value, expires: Date.now() + ttlMs });
    }

    async del(key: string) {
        this.cache.delete(key);
    }

    async wrap<T>(key: string, fn: () => Promise<T>, options?: { ttl?: number }): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== undefined) {
            return cached;
        }

        const result = await fn();
        await this.set(key, result, options?.ttl);

        return result;
    }

    getStoreType() {
        return "In-Memory";
    }
}


export const initCacheManager = async () => {
    const cache_ttl_ms = serverEnv.CACHE_TTL_MIN * 60 * 1000;

    let cache: CacheStore;

    if (serverEnv.REDIS_ENABLED) {
        const redis = await getRedisConnection();
        cache = new RedisCacheStore(redis, cache_ttl_ms);
    }
    else {
        cache = new MemoryCacheStore(cache_ttl_ms);
    }

    console.log(`${cache.getStoreType()} cache init. Default TTL: ${cache_ttl_ms / 1000}s`);

    return cache;
};
