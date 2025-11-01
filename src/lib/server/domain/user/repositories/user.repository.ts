import {getDbClient} from "@/lib/server/database/async-storage";
import {and, asc, count, desc, eq, like, sql} from "drizzle-orm";
import {ApiProviderType, MediaType, PrivacyType} from "@/lib/utils/enums";
import {AdminUpdatePayload, SearchTypeAdmin} from "@/lib/types/zod.schema.types";
import {ProviderSearchResult, ProviderSearchResults} from "@/lib/types/provider.types";
import {followers, taskHistory, user, userMediaSettings} from "@/lib/server/database/schema";


export class UserRepository {
    // --- Tasks Maintenance ----------------------------------------------------

    static async deleteNonActivatedOldUsers() {
        const result = await getDbClient()
            .delete(user)
            .where(and(eq(user.emailVerified, false), sql`${user.createdAt} < datetime('now', '-7 days')`))
            .returning({ id: user.id });

        return result.length;
    }

    // --- Admin Stats ----------------------------------------------------

    static async getAdminUserStats() {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

        const res = await getDbClient()
            .select({
                totalUsers: count(),
                usersSeenThisMonth: sql<number>`SUM(CASE WHEN ${user.updatedAt} > ${currentMonthStart} THEN 1 ELSE 0 END)`,
                newUsersThisMonth: sql<number>`SUM(CASE WHEN ${user.createdAt} >= ${currentMonthStart} THEN 1 ELSE 0 END)`,
                newUsersPreviousMonth: sql<number>`SUM(CASE WHEN ${user.createdAt} >= ${previousMonthStart} AND ${user.createdAt} < ${currentMonthStart} THEN 1 ELSE 0 END)`,
            })
            .from(user)
            .get();

        return {
            totalUsers: { count: res?.totalUsers || 0 },
            usersSeenThisMonth: { count: res?.usersSeenThisMonth || 0 },
            newUsers: {
                count: res?.newUsersThisMonth || 0,
                comparedToLastMonth: (res?.newUsersThisMonth || 0) - (res?.newUsersPreviousMonth || 0),
            },
        };
    }

    static async getAdminCumulativeUsersPerMonth(months?: number) {
        const results = await getDbClient()
            .all<{ month: string, count: number }>(sql`
                WITH monthly_buckets AS (
                    SELECT 
                        strftime('%Y-%m', created_at) as month,
                        strftime('%Y-%m-01', created_at) as month_start
                    FROM user
                    WHERE created_at <= date('now')
                ), 
                monthly_agg AS (
                    SELECT 
                        month,
                        month_start,
                        COUNT(*) as monthly_count,
                        SUM(COUNT(*)) OVER (ORDER BY month_start ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as cum_count
                    FROM monthly_buckets
                    GROUP BY month, month_start
                )
                SELECT
                    month,
                    cum_count as count
                FROM (
                    SELECT *
                    FROM monthly_agg
                    ORDER BY month_start DESC
                    LIMIT ${months ?? 9999999}
                ) AS recent_months
                ORDER BY month_start ASC
            `);

        return results.map((row) => ({
            count: row.count,
            month: new Date(row.month).toLocaleString("en-US", { month: "short", year: "numeric" }),
        }));
    }

    static async getAdminRecentUsers(limit: number) {
        return getDbClient()
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                privacy: user.privacy,
                updatedAt: user.updatedAt,
                createdAt: user.createdAt,
            })
            .from(user)
            .orderBy(desc(user.updatedAt))
            .limit(limit)
            .execute();
    }

    static async getAdminUsersPerPrivacyValue() {
        const implementedPrivacyValues = Object.values(PrivacyType).filter((p) => p !== PrivacyType.PRIVATE);

        const result = await getDbClient()
            .select({
                count: count(),
                privacy: user.privacy,
            })
            .from(user)
            .groupBy(user.privacy);

        return implementedPrivacyValues.map((privacy) => ({
            privacy,
            count: result.find((r) => r.privacy === privacy)?.count ?? 0,
        }));
    }

    static async getAdminArchivedTasks() {
        return getDbClient()
            .select()
            .from(taskHistory)
            .orderBy(desc(taskHistory.startedAt));
    }

    // --------------------------------------------------------------------

    static async findUserByName(name: string) {
        return getDbClient()
            .select()
            .from(user)
            .where(eq(user.name, name))
            .get();
    }

    static async updateUserSettings(userId: number, payload: Partial<typeof user.$inferInsert>) {
        await getDbClient()
            .update(user)
            .set(payload)
            .where(eq(user.id, userId));
    }

    static async getAdminPaginatedUsers(data: SearchTypeAdmin) {
        const page = data.page ?? 1;
        const search = data.search ?? "";
        const perPage = data.perPage ?? 25;
        const sortDesc = data.sortDesc ?? true;
        const sorting = data.sorting ?? "updatedAt";
        const offset = (page - 1) * perPage;

        const totalUsers = await getDbClient()
            .select({ count: count() })
            .from(user)
            .where(like(user.name, `%${search}%`))
            .get();

        const users = await getDbClient()
            .select()
            .from(user)
            .offset(offset)
            .limit(perPage)
            //@ts-expect-error, we know sorting is in user table
            .orderBy(sortDesc ? desc(user[sorting]) : asc(user[sorting]))
            .where(like(user.name, `%${search}%`))
            .execute();

        return {
            items: users,
            total: totalUsers?.count || 0,
            pages: Math.ceil((totalUsers?.count || 0) / perPage),
        };
    }

    static async adminUpdateUser(userId: number, payload: Omit<AdminUpdatePayload, "deleteUser">) {
        await getDbClient()
            .update(user)
            .set(payload)
            .where(eq(user.id, userId))
            .execute();
    }

    static async updateFeatureFlag(userId: number) {
        await getDbClient()
            .update(user)
            .set({ showUpdateModal: false })
            .where(eq(user.id, userId))
            .execute();
    }

    static async deleteUserAccount(userId: number) {
        await getDbClient()
            .delete(user)
            .where(eq(user.id, userId))
            .execute();
    }

    static async adminUpdateFeaturesFlag(showUpdateModal: boolean) {
        await getDbClient()
            .update(user)
            .set({ showUpdateModal })
            .execute();
    }

    static async findByUsername(username: string) {
        const userResult = await getDbClient().query.user.findFirst({
            where: eq(user.name, username),
            with: { userMediaSettings: true }
        });
        if (!userResult) return null;

        const followersCount = await getDbClient()
            .select({ count: count() })
            .from(followers)
            .where(eq(followers.followedId, userResult.id))
            .get();

        return {
            ...userResult,
            followersCount: followersCount?.count || 0
        };
    }

    static async updateNotificationsReadTime(userId: number) {
        return getDbClient()
            .update(user)
            .set({ lastNotifReadTime: sql`datetime('now')` })
            .where(eq(user.id, userId))
            .execute();
    }

    static async findById(userId: number) {
        return getDbClient().query.user.findFirst({
            where: eq(user.id, userId),
            with: { userMediaSettings: true }
        });
    }

    static async updateFollowStatus(userId: number, followedId: number) {
        const currentFollow = await getDbClient().query.followers.findFirst({
            where: and(eq(followers.followerId, userId), eq(followers.followedId, followedId)),
        });

        if (!currentFollow) {
            await getDbClient()
                .insert(followers)
                .values({ followerId: userId, followedId: followedId });
        }
        else {
            await getDbClient()
                .delete(followers)
                .where(and(eq(followers.followerId, userId), eq(followers.followedId, followedId)));
        }
    }

    static async hasActiveMediaType(userId: number, mediaType: MediaType) {
        const setting = await getDbClient().query.userMediaSettings.findFirst({
            where: and(
                eq(userMediaSettings.userId, userId),
                eq(userMediaSettings.mediaType, mediaType),
                eq(userMediaSettings.active, true),
            ),
        });

        return !!setting;
    }

    static async incrementMediaTypeView(userId: number, mediaType: MediaType) {
        await getDbClient()
            .update(userMediaSettings)
            .set({ views: sql`${userMediaSettings.views} + 1` })
            .where(and(eq(userMediaSettings.userId, userId), eq(userMediaSettings.mediaType, mediaType)));
    }

    static async isFollowing(userId: number, followedId: number) {
        const result = await getDbClient()
            .select()
            .from(followers)
            .where(and(eq(followers.followerId, userId), eq(followers.followedId, followedId)))
            .get();

        return !!result;
    }

    static async incrementProfileView(userId: number) {
        return getDbClient()
            .update(user)
            .set({ profileViews: sql`${user.profileViews} + 1` })
            .where(eq(user.id, userId));
    }

    static async getUserFollowers(userId: number, limit: number = 8) {
        const totalCountResult = await getDbClient()
            .select({ value: sql<number>`count()` })
            .from(followers)
            .where(eq(followers.followedId, userId))
            .get()

        const total = totalCountResult?.value ?? 0;

        const followersUsers = await getDbClient()
            .select({
                id: user.id,
                username: user.name,
                image: user.image,
                privacy: user.privacy,
            })
            .from(followers)
            .innerJoin(user, eq(followers.followerId, user.id))
            .where(eq(followers.followedId, userId))
            .orderBy(asc(user.name))
            .limit(limit);

        return { total: total, followers: followersUsers };
    }

    static async getUserFollows(userId: number, limit: number = 8) {
        const totalCountResult = await getDbClient()
            .select({ value: sql<number>`count()` })
            .from(followers)
            .where(eq(followers.followerId, userId))
            .get();

        const total = totalCountResult?.value ?? 0;

        const followedUsers = await getDbClient()
            .select({
                id: user.id,
                image: user.image,
                username: user.name,
                privacy: user.privacy,
            })
            .from(followers)
            .innerJoin(user, eq(followers.followedId, user.id))
            .where(eq(followers.followerId, userId))
            .orderBy(asc(user.name))
            .limit(limit);

        return { total: total, follows: followedUsers };
    }

    static async searchUsers(query: string, page: number = 1): Promise<ProviderSearchResults> {
        const countUsers = await getDbClient()
            .select({ count: count() })
            .from(user)
            .where(like(user.name, `%${query}%`))
            .get()

        const hasNextPage = (countUsers?.count ?? 0) > page * 20;

        const dbUsers = await getDbClient()
            .select({
                id: user.id,
                name: user.name,
                image: user.image,
                date: user.createdAt,
            })
            .from(user)
            .where(like(user.name, `%${query}%`))
            .orderBy(asc(user.name))
            .limit(20)
            .offset((page - 1) * 20);

        const users = dbUsers.map((user) => ({ ...user, itemType: ApiProviderType.USERS }) as ProviderSearchResult);

        return { data: users, hasNextPage };
    }
}
