import {db} from "@/lib/server/database/db";
import {and, desc, eq, getTableColumns, inArray} from "drizzle-orm";
import {followers, user, userMediaUpdate} from "@/lib/server/database/schema";


export class UserUpdatesRepository {
    static async getUserUpdates(userId: number, limit = 8) {
        return db.query.userMediaUpdate.findMany({
            where: eq(userMediaUpdate.userId, userId),
            orderBy: [desc(userMediaUpdate.timestamp)],
            limit: limit,
        });
    }

    static async getFollowsUpdates(userId: number, asPublic: boolean, limit = 10) {
        let allowedUserIdsQuery;

        if (asPublic) {
            allowedUserIdsQuery = db
                .select({ id: user.id }).from(followers)
                .leftJoin(user, eq(followers.followedId, user.id))
                .where(and(eq(followers.followerId, userId), eq(user.privacy, "PUBLIC")));
        }
        else {
            allowedUserIdsQuery = db
                .select({ id: followers.followedId }).from(followers)
                .where(eq(followers.followerId, userId));
        }

        const followsUpdates = await db
            .select({ ...getTableColumns(userMediaUpdate), username: user.name })
            .from(userMediaUpdate)
            .leftJoin(user, eq(userMediaUpdate.userId, user.id))
            .where(inArray(userMediaUpdate.userId, allowedUserIdsQuery))
            .orderBy(desc(userMediaUpdate.timestamp))
            .limit(limit);

        return followsUpdates;
    }
}
