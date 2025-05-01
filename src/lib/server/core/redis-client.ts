import dotenv from "dotenv";
import {Redis} from "ioredis";


dotenv.config();


let redisInstance: Redis | null = null;
let connectionPromise: Promise<Redis> | null = null;


export const connectRedis = ({ bypassEnv = false }: { bypassEnv?: boolean } = {}) => {
    const nodeEnv = process.env.NODE_ENV;

    if (redisInstance?.status === "ready" || redisInstance?.status === "connecting") {
        return connectionPromise || Promise.resolve(redisInstance);
    }
    if (redisInstance?.status === "connect") {
        return connectionPromise || Promise.resolve(redisInstance);
    }

    if (!bypassEnv && nodeEnv !== "production") {
        return Promise.resolve(null);
    }

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        return Promise.reject(new Error("REDIS_URL environment variable not set."));
    }

    if (!connectionPromise) {
        console.log("Attempting to connect to Redis using ioredis...");

        redisInstance = new Redis(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: null,
        });

        connectionPromise = new Promise((resolve, reject) => {
            redisInstance!.on("connect", () => console.log("ioredis: connecting..."));
            redisInstance!.on("ready", () => {
                console.log("ioredis: client ready.");
                resolve(redisInstance!);
            });
            redisInstance!.on("error", (error) => {
                console.error("ioredis: Client Error:", error);
                if (redisInstance?.status !== "ready" && redisInstance?.status !== "connecting") {
                    connectionPromise = null;
                    redisInstance = null;
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
