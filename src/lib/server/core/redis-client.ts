import {createClient, RedisClientType} from "redis";


let isConnecting = false;
let redisInstance: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType> | null = null;


export const connectRedis = () => {
    const nodeEnv = process.env.NODE_ENV;

    if (redisInstance?.isReady) {
        return Promise.resolve(redisInstance);
    }

    if (isConnecting && connectionPromise) {
        return connectionPromise;
    }

    if (nodeEnv !== "production") {
        return Promise.resolve(null);
    }

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        return Promise.reject(new Error("REDIS_URL environment variable not set."));
    }

    isConnecting = true;
    connectionPromise = (async () => {
        console.log("Attempting to connect to Redis...");

        if (!redisInstance) {
            redisInstance = createClient({
                url: redisUrl,
                socket: {
                    connectTimeout: 5000,
                    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
                },
            });

            redisInstance.on("error", (error) => console.error("Redis Client Error:", error));
            redisInstance.on("connect", () => console.log("Redis client connecting..."));
            redisInstance.on("ready", () => console.log("Redis client ready."));
            redisInstance.on("end", () => console.log("Redis client connection closed."));
            redisInstance.on("reconnecting", () => console.warn("Redis client reconnecting..."));
        }

        try {
            if (!redisInstance.isOpen) {
                await redisInstance.connect();
            }
            console.log("Successfully connected to Redis.");
            isConnecting = false;

            return redisInstance;
        }
        catch (error) {
            console.error("FATAL: Failed to connect to Redis:", error);
            isConnecting = false;
            
            throw error;
        }
    })();

    return connectionPromise;
};
