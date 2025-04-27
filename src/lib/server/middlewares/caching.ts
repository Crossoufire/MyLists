import {createMiddleware} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";


export const trendsCacheMiddleware = createMiddleware().server(async ({ next, data }) => {
    const cacheKey = `$trends:${JSON.stringify(data ?? null)}`;

    const result = getContainer().cacheManager.wrap(
        cacheKey,
        async () => {
            return await next();
        },
        { ttl: 60 * 60 * 1000 },
    );

    return result;
});


export const platformStatsCacheMiddleware = createMiddleware().server(async ({ next, data }) => {
    const cacheKey = `$trends:${JSON.stringify(data ?? null)}`;

    const result = getContainer().cacheManager.wrap(
        cacheKey,
        async () => {
            console.log(`Cache MISS for key: ${cacheKey}. Executing function.`);
            const freshResult = await next();
            return freshResult;
        },
        { ttl: 24 * 60 * 60 * 1000 },
    );

    console.log(`Returning result for key: ${cacheKey}`);

    return result;
});
