import {eq, sql} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {user} from "@/lib/server/database/schema";
import {getContainer} from "@/lib/server/core/container";


const LAST_SEEN_CACHE_KEY = "lastSeen:";
const UPDATE_THRESHOLD_MS = 5 * 60 * 1000;


export const updateLastSeen = async (name: string) => {
    const container = await getContainer();
    const cacheManager = container.cacheManager;
    const cacheKey = `${LAST_SEEN_CACHE_KEY}${name}`;

    if (await cacheManager.get(cacheKey)) {
        return;
    }

    await cacheManager.set(cacheKey, true, UPDATE_THRESHOLD_MS);

    setImmediate(() => {
        db.update(user)
            .set({ updatedAt: sql`datetime('now')` })
            .where(eq(user.name, name));
    });
};
