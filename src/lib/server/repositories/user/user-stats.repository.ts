import {and, eq} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {userMediaSettings} from "@/lib/server/database/schema";


export class UserStatsRepository {
    static async getActiveSettings(userId: number) {
        const settings = await db.query.userMediaSettings.findMany({
            where: and(eq(userMediaSettings.userId, userId), eq(userMediaSettings.active, true)),
        });
        return settings;
    }
}
