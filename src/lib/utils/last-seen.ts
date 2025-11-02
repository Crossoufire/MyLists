import {eq, sql} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {user} from "@/lib/server/database/schema";
import {getContainer} from "@/lib/server/core/container";
import {createServerOnlyFn} from "@tanstack/react-start";


const LAST_SEEN_CACHE_KEY = "lastSeen:";
const UPDATE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes;


export const updateLastSeen = createServerOnlyFn(() => async (name: string) => {
    const cacheKey = `${LAST_SEEN_CACHE_KEY}${name}`;
    const cacheManager = await getContainer().then((c) => c.cacheManager);

    if (await cacheManager.get(cacheKey)) {
        return;
    }

    await cacheManager.set(cacheKey, true, UPDATE_THRESHOLD_MS);

    db.update(user)
        .set({ updatedAt: sql`datetime('now')` })
        .where(eq(user.name, name))
        .catch();
})();
