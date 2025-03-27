import {desc, eq} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {userMediaUpdate} from "@/lib/server/database/schema";


export class UserUpdatesRepository {
    static async getUserUpdates(userId: string, limit = 8) {
        return db.query.userMediaUpdate.findMany({
            // @ts-ignore
            where: eq(userMediaUpdate.userId, userId),
            orderBy: [desc(userMediaUpdate.timestamp)],
            limit: limit,
        });
    }

    static async getFollowsUpdates(userId: string, limit = 10) {
        return db.query.userMediaUpdate.findMany({
            // @ts-ignore
            where: eq(userMediaUpdate.userId, userId),
            orderBy: [desc(userMediaUpdate.timestamp)],
            limit: limit,
        });
    }
}
