import {getDbClient} from "@/lib/server/database/async-storage";
import {MediaType, PrivacyType} from "@/lib/server/utils/enums";
import {followers, user, userMediaUpdate} from "@/lib/server/database/schema";
import {and, count, desc, eq, getTableColumns, inArray, like, sql} from "drizzle-orm";
import {AllUpdatesSearch} from "@/lib/types/zod.schema.types";


export class UserUpdatesRepository {
    static async getUserUpdates(userId: number, limit = 8) {
        return getDbClient().query.userMediaUpdate.findMany({
            where: eq(userMediaUpdate.userId, userId),
            orderBy: [desc(userMediaUpdate.timestamp)],
            limit: limit,
        });
    }

    static async getUserUpdatesPaginated(userId: number, filters: AllUpdatesSearch) {
        const page = filters?.page ?? 1;
        const limit = filters?.perPage ?? 25;
        const search = filters?.search ?? "";
        const offset = (page - 1) * limit;

        const totalCountResult = await getDbClient()
            .select({ count: sql<number>`count()` })
            .from(userMediaUpdate)
            .where(and(eq(userMediaUpdate.userId, userId), like(userMediaUpdate.mediaName, `%${search}%`)))
            .get();

        const historyResult = await getDbClient()
            .select()
            .from(userMediaUpdate)
            .where(and(eq(userMediaUpdate.userId, userId), like(userMediaUpdate.mediaName, `%${search}%`)))
            .orderBy(desc(userMediaUpdate.timestamp))
            .offset(offset)
            .limit(limit)
            .execute();

        return { total: totalCountResult?.count ?? 0, items: historyResult };
    }

    static async getUserMediaHistory(userId: number, mediaType: MediaType, mediaId: number) {
        return getDbClient()
            .select()
            .from(userMediaUpdate)
            .where(and(
                eq(userMediaUpdate.userId, userId),
                eq(userMediaUpdate.mediaType, mediaType),
                eq(userMediaUpdate.mediaId, mediaId),
            ))
            .orderBy(desc(userMediaUpdate.timestamp))
            .execute();
    }

    static async getFollowsUpdates(userId: number, asPublic: boolean, limit = 10) {
        let allowedUserIdsQuery;

        if (asPublic) {
            allowedUserIdsQuery = getDbClient()
                .select({ id: user.id }).from(followers)
                .leftJoin(user, eq(followers.followedId, user.id))
                .where(and(eq(followers.followerId, userId), eq(user.privacy, PrivacyType.PUBLIC)));
        }
        else {
            allowedUserIdsQuery = getDbClient()
                .select({ id: followers.followedId }).from(followers)
                .where(eq(followers.followerId, userId));
        }

        const followsUpdates = await getDbClient()
            .select({
                username: user.name,
                ...getTableColumns(userMediaUpdate),
            })
            .from(userMediaUpdate)
            .leftJoin(user, eq(userMediaUpdate.userId, user.id))
            .where(inArray(userMediaUpdate.userId, allowedUserIdsQuery))
            .orderBy(desc(userMediaUpdate.timestamp))
            .limit(limit);

        return followsUpdates;
    }

    static async mediaUpdatesStatsPerMonth({ mediaType, userId }: { mediaType?: MediaType, userId?: number }) {
        const conditions = [];
        if (userId) conditions.push(eq(userMediaUpdate.userId, userId));
        if (mediaType) conditions.push(eq(userMediaUpdate.mediaType, mediaType));

        const monthlyCounts = await getDbClient()
            .select({
                name: sql<string>`strftime('%m-%Y', ${userMediaUpdate.timestamp})`.as("name"),
                value: count(userMediaUpdate.mediaId).as("value"),
            })
            .from(userMediaUpdate)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(sql`strftime('%m-%Y', ${userMediaUpdate.timestamp})`)
            .orderBy(sql`strftime('%Y-%m', ${userMediaUpdate.timestamp})`);

        const totalUpdates = monthlyCounts.reduce((a, c) => a + c.value, 0);

        return {
            updatesDistribution: monthlyCounts,
            avgUpdates: monthlyCounts.length > 0 ? (totalUpdates / monthlyCounts.length).toFixed(1) : "-",
            totalUpdates,
        };
    }

    static async deleteUserUpdates(userId: number, updateIds: number[], returnData: boolean) {
        await getDbClient()
            .delete(userMediaUpdate)
            .where(and(eq(userMediaUpdate.userId, userId), inArray(userMediaUpdate.id, updateIds)))
            .execute();

        if (returnData) {
            const newUpdateToReturn = await getDbClient()
                .select()
                .from(userMediaUpdate)
                .where(eq(userMediaUpdate.userId, userId))
                .orderBy(desc(userMediaUpdate.timestamp))
                .limit(8)
                .execute();

            return newUpdateToReturn?.at(-1) ?? null;
        }
    }

    static async deleteMediaUpdates(mediaType: MediaType, mediaIds: number[]) {
        await getDbClient()
            .delete(userMediaUpdate)
            .where(and(eq(userMediaUpdate.mediaType, mediaType), inArray(userMediaUpdate.mediaId, mediaIds)))
            .execute();
    }
}
