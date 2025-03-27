import {and, eq} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {user, userMediaSettings} from "@/lib/server/database/schema";


export class UserStatsRepository {
    static async getActiveSettings(userId: string) {
        return db.query.userMediaSettings.findMany({
            //@ts-ignore
            where: and(eq(user.id, userId), eq(userMediaSettings.active, true)),
        });
    }
}
