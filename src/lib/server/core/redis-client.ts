import {Redis} from "ioredis";
import {serverEnv} from "@/env/server";


let redisInstance: Redis | null = null;
let connectionPromise: Promise<Redis> | null = null;


export const connectRedis = () => {
    if (redisInstance?.status === "ready" || redisInstance?.status === "connecting" || redisInstance?.status === "connect") {
        return connectionPromise || Promise.resolve(redisInstance);
    }

    if (!connectionPromise) {
        console.log("Attempting to connect to Redis using ioredis...");

        redisInstance = new Redis(serverEnv.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: null });

        connectionPromise = new Promise((resolve, reject) => {
            redisInstance!.on("connect", () => console.log("ioredis: connecting..."));
            redisInstance!.on("ready", () => {
                console.log("ioredis: client ready.");
                resolve(redisInstance!);
            });
            redisInstance!.on("error", (error) => {
                console.error("ioredis: Client Error:", error);
                if (redisInstance?.status !== "ready" && redisInstance?.status !== "connecting") {
                    redisInstance = null;
                    connectionPromise = null;
                    reject(error);
                }
            });
            redisInstance!.on("end", () => console.log("ioredis: client connection closed."));
            redisInstance!.on("reconnecting", () => console.warn("ioredis: client reconnecting..."));
            redisInstance!.connect().catch(reject);
        });
    }

    return connectionPromise;
};


export const getRedisConnection = async () => {
    const { connectRedis } = await import("@/lib/server/core/redis-client");
    const redisConnection = await connectRedis();
    if (!redisConnection) {
        throw new Error("Failed to connect to Redis.");
    }

    return redisConnection;
};
