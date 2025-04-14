import {db} from "@/lib/server/database/db";
import {MediaType, PrivacyType} from "@/lib/server/utils/enums";
import {followers, user, userMediaUpdate} from "@/lib/server/database/schema";
import {and, count, desc, eq, getTableColumns, inArray, sql} from "drizzle-orm";


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
                .where(and(eq(followers.followerId, userId), eq(user.privacy, PrivacyType.PUBLIC)));
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

    static async getUpdatesCountPerMonth(userId: number) {
        const monthlyCountsQuery = db
            .select({
                month: sql<string>`strftime('%m-%Y', ${userMediaUpdate.timestamp})`.as("month"),
                count: count(userMediaUpdate.mediaId).as("count"),
            })
            .from(userMediaUpdate)
            .where(eq(userMediaUpdate.userId, userId))
            .groupBy(sql`strftime('%m-%Y', ${userMediaUpdate.timestamp})`)
            .orderBy(sql`strftime('%m-%Y', ${userMediaUpdate.timestamp})`)

        const results = await monthlyCountsQuery.execute();

        const updatesPerMonth: Record<string, number> = {};
        let totalUpdates = 0;
        let numberOfMonths = 0;
        results.forEach((row) => {
            if (row.month && typeof row.count === "number") {
                updatesPerMonth[row.month] = row.count;
                totalUpdates += row.count;
                numberOfMonths++;
            }
        });

        const averageUpdatesPerMonth = numberOfMonths > 0 ? (totalUpdates / numberOfMonths) : null;

        return { updatesDistribution: updatesPerMonth, avgUpdates: averageUpdatesPerMonth };
    }

    static async getMediaUpdatesCountPerMonth(userId: number, mediaType: MediaType) {
        const monthlyCountsQuery = db
            .select({
                month: sql<string>`strftime('%m-%Y', ${userMediaUpdate.timestamp})`.as("month"),
                count: count(userMediaUpdate.mediaId).as("count"),
            })
            .from(userMediaUpdate)
            .where(and(eq(userMediaUpdate.userId, userId), eq(userMediaUpdate.mediaType, mediaType)))
            .groupBy(sql`strftime('%m-%Y', ${userMediaUpdate.timestamp})`)
            .orderBy(sql`strftime('%m-%Y', ${userMediaUpdate.timestamp})`)

        const results = await monthlyCountsQuery.execute();

        const updatesPerMonth: Record<string, number> = {};
        let totalUpdates = 0;
        let numberOfMonths = 0;
        results.forEach((row) => {
            if (row.month && typeof row.count === "number") {
                updatesPerMonth[row.month] = row.count;
                totalUpdates += row.count;
                numberOfMonths++;
            }
        });

        const averageUpdatesPerMonth = numberOfMonths > 0 ? (totalUpdates / numberOfMonths) : null;

        return { updatesDistribution: updatesPerMonth, avgUpdates: averageUpdatesPerMonth };
    }

    static async deleteUserUpdates(userId: number, updateIds: number[], returnData: boolean) {
        await db
            .delete(userMediaUpdate)
            .where(and(eq(userMediaUpdate.userId, userId), inArray(userMediaUpdate.id, updateIds)))
            .execute();

        if (returnData) {
            const newUpdateToReturn = await db
                .select()
                .from(userMediaUpdate)
                .where(eq(userMediaUpdate.userId, userId))
                .orderBy(desc(userMediaUpdate.timestamp))
                .limit(8)
                .execute();
            return newUpdateToReturn?.at(-1) ?? null;
        }
    }
}
