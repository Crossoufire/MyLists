import {createMiddleware} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";


export const trendsCacheMiddleware = createMiddleware({ type: "function" })
    .server(async ({ next, data }) => {
        const cacheKey = `$trends:${JSON.stringify(data ?? null)}`;

        // Cached for 1 hour
        return getContainer()
            .then((c) => c.cacheManager.wrap(
                cacheKey,
                async () => next(),
                { ttl: 60 * 60 * 1000 },
            ));
    });


export const platformStatsCacheMiddleware = createMiddleware({ type: "function" })
    .server(async ({ next, data }) => {
        const cacheKey = `platformStats:${JSON.stringify(data ?? null)}`;

        // Cached for 24 hours
        return getContainer()
            .then((c) => c.cacheManager.wrap(
                cacheKey,
                async () => next(),
                { ttl: 24 * 60 * 60 * 1000 },
            ));
    });
