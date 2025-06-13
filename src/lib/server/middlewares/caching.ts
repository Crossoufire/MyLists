import {createMiddleware} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";


export const trendsCacheMiddleware = createMiddleware({ type: "function" }).server(async ({ next, data }) => {
    const cacheKey = `$trends:${JSON.stringify(data ?? null)}`;

    const result = getContainer().cacheManager.wrap(
        cacheKey,
        async () => next(),
        { ttl: 60 * 60 * 1000 },
    );

    return result;
});
