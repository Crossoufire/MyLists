import {and, eq, sql} from "drizzle-orm";
import {profileCustom} from "@/lib/server/database/schema";
import {getDbClient} from "@/lib/server/database/async-storage";
import {HighlightedMediaSettings} from "@/lib/types/profile-custom.types";


export class UserProfileRepository {
    static async getHighlightedMediaSettings(userId: number) {
        const settings = getDbClient()
            .select()
            .from(profileCustom)
            .where(and(eq(profileCustom.userId, userId), eq(profileCustom.key, "highlightedMedia")))
            .get();

        return settings?.value as HighlightedMediaSettings | undefined;
    }

    static async upsertHighlightedMediaSettings(userId: number, value: HighlightedMediaSettings) {
        await getDbClient()
            .insert(profileCustom)
            .values({ userId, key: "highlightedMedia", value })
            .onConflictDoUpdate({
                target: [profileCustom.userId, profileCustom.key],
                set: {
                    value,
                    updatedAt: sql`datetime('now')`,
                },
            });
    }
}
