import {LogUpdateParams} from "@/lib/types/base.types";
import {MediaType, PrivacyType} from "@/lib/utils/enums";
import {AllUpdatesSearch} from "@/lib/types/zod.schema.types";
import {getDbClient} from "@/lib/server/database/async-storage";
import {followers, user, userMediaUpdate} from "@/lib/server/database/schema";
import {and, count, desc, eq, getTableColumns, inArray, like, or, sql} from "drizzle-orm";


export class UserUpdatesRepository {
    static readonly updateThresholdSec = 300;

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

        const totalCount = getDbClient()
            .select({ count: sql<number>`count()` })
            .from(userMediaUpdate)
            .where(and(eq(userMediaUpdate.userId, userId), like(userMediaUpdate.mediaName, `%${search}%`)))
            .get()?.count ?? 0;

        const historyResult = await getDbClient()
            .select()
            .from(userMediaUpdate)
            .where(and(eq(userMediaUpdate.userId, userId), like(userMediaUpdate.mediaName, `%${search}%`)))
            .orderBy(desc(userMediaUpdate.timestamp))
            .offset(offset)
            .limit(limit);

        return { total: totalCount, items: historyResult };
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
            .orderBy(desc(userMediaUpdate.timestamp));
    }

    static async getFollowsUpdates(profileOwnerId: number, visitorId?: number, limit = 10) {
        // Subquery: People that Profile Owner (User B) follows
        const followedByB = getDbClient()
            .select({ id: followers.followedId })
            .from(followers)
            .where(eq(followers.followerId, profileOwnerId));

        // Subquery: People that Visitor (User A) follows (Rule 3)
        const followedByA = visitorId
            ? getDbClient()
                .select({ id: followers.followedId })
                .from(followers)
                .where(eq(followers.followerId, visitorId))
            : null;

        // Define privacy filters based on rules
        const privacyConditions = [eq(user.privacy, PrivacyType.PUBLIC)] as any[];

        if (visitorId) {
            // Rule: Restricted updates visible only if logged in
            privacyConditions.push(eq(user.privacy, PrivacyType.RESTRICTED));

            // Rule: User A can always see their own updates
            privacyConditions.push(eq(user.id, visitorId));

            // Rule: Private updates visible only if User A follows that person
            if (followedByA) {
                privacyConditions.push(and(eq(user.privacy, PrivacyType.PRIVATE), inArray(user.id, followedByA)));
            }
        }

        return getDbClient()
            .select({
                username: user.name,
                ...getTableColumns(userMediaUpdate),
            })
            .from(userMediaUpdate)
            .innerJoin(user, eq(userMediaUpdate.userId, user.id))
            .where(and(
                // Limit updates to people User B follows
                inArray(userMediaUpdate.userId, followedByB),
                // Apply the combined privacy rules
                or(...privacyConditions)
            ))
            .orderBy(desc(userMediaUpdate.timestamp))
            .limit(limit);
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
            totalUpdates: totalUpdates,
            updatesDistribution: monthlyCounts,
            avgUpdates: monthlyCounts.length ? (totalUpdates / monthlyCounts.length) : null,
        };
    }

    static async deleteUserUpdates(userId: number, updateIds: number[], returnData: boolean) {
        await getDbClient()
            .delete(userMediaUpdate)
            .where(and(eq(userMediaUpdate.userId, userId), inArray(userMediaUpdate.id, updateIds)));

        if (returnData) {
            return getDbClient()
                .select()
                .from(userMediaUpdate)
                .where(eq(userMediaUpdate.userId, userId))
                .orderBy(desc(userMediaUpdate.timestamp))
                .limit(8).then((res) => res[res.length - 1] ?? null);
        }
    }

    static async deleteMediaUpdates(mediaType: MediaType, mediaIds: number[]) {
        await getDbClient()
            .delete(userMediaUpdate)
            .where(and(eq(userMediaUpdate.mediaType, mediaType), inArray(userMediaUpdate.mediaId, mediaIds)));
    }

    static async logUpdate({ userId, mediaType, media, updateType, payload }: LogUpdateParams) {
        const newUpdate = {
            userId,
            payload,
            mediaType,
            updateType,
            mediaId: media.id,
            mediaName: media.name,
        };

        const previousUpdate = await getDbClient()
            .select()
            .from(userMediaUpdate).where(and(
                eq(userMediaUpdate.userId, userId),
                eq(userMediaUpdate.mediaId, media.id),
                eq(userMediaUpdate.mediaType, mediaType),
            ))
            .orderBy(desc(userMediaUpdate.timestamp))
            .get();

        if (previousUpdate) {
            const elapsedSec = (Date.now() - new Date(previousUpdate.timestamp + "Z").getTime()) / 1000;
            if (elapsedSec <= this.updateThresholdSec) {
                await getDbClient()
                    .delete(userMediaUpdate)
                    .where(eq(userMediaUpdate.id, previousUpdate.id));
            }
        }

        await getDbClient()
            .insert(userMediaUpdate)
            .values(newUpdate);
    }
}
