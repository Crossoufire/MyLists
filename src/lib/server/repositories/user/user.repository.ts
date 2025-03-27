import {asc, eq, sql} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {followers, user} from "@/lib/server/database/schema";


export class UserRepository {
    static async findByUsername(username: string) {
        return db.query.user.findFirst({ where: eq(user.name, username) });
    }

    static async incrementProfileView(userId: string) {
        // @ts-ignore
        return db.update(user).set({ profileViews: sql`${user.profileViews} + 1` }).where(eq(user.id, userId));
    }

    static async getUserFollows({ userId, limit = 8 }: { userId: string, limit?: number }) {
        return db.query.followers.findMany({
            // @ts-ignore
            where: eq(user.id, userId),
            orderBy: [asc(followers.followerId)],
            limit: limit,
        });
    }
}
