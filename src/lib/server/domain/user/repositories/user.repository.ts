import {getDbClient} from "@/lib/server/database/async-storage";
import {and, asc, count, desc, eq, like, sql} from "drizzle-orm";
import {ApiProviderType, MediaType} from "@/lib/utils/enums";
import {followers, user, userMediaSettings} from "@/lib/server/database/schema";
import {AdminUpdatePayload, SearchTypeAdmin} from "@/lib/types/zod.schema.types";
import {ProviderSearchResult, ProviderSearchResults} from "@/lib/types/provider.types";


type AdminUserStats = {
    now: string;
    threeMonthsAgo: string;
    currentMonthStart: string;
    twoMonthsAgoStart: string;
    previousMonthStart: string;
}


export class UserRepository {
    static async deleteNonActivatedOldUsers() {
        const result = await getDbClient()
            .delete(user)
            .where(and(eq(user.emailVerified, false), sql`${user.createdAt} < datetime('now', '-7 days')`))
            .returning({ id: user.id });

        return result.length;
    }

    static async getAdminUserStatistics(dates: AdminUserStats) {
        const { now, currentMonthStart, previousMonthStart, twoMonthsAgoStart, threeMonthsAgo } = dates;

        const result = await getDbClient()
            .select({
                totalUsers: count(),
                totalUsersPreviousMonth: sql<number>`SUM(CASE WHEN ${user.createdAt} < ${currentMonthStart} THEN 1 ELSE 0 END)`,
                totalUsersTwoMonthsAgo: sql<number>`SUM(CASE WHEN ${user.createdAt} < ${previousMonthStart} THEN 1 ELSE 0 END)`,
                activeUsers: sql<number>`SUM(CASE WHEN ${user.updatedAt} > ${threeMonthsAgo} THEN 1 ELSE 0 END)`,
                activeUsersPreviousMonth: sql<number>`SUM(CASE WHEN ${user.updatedAt} > ${threeMonthsAgo} AND ${user.updatedAt} < ${previousMonthStart} THEN 1 ELSE 0 END)`,
                activeUsersTwoMonthsAgo: sql<number>`SUM(CASE WHEN ${user.updatedAt} > ${threeMonthsAgo} AND ${user.updatedAt} < ${twoMonthsAgoStart} THEN 1 ELSE 0 END)`,
                newUsersThisMonth: sql<number>`SUM(CASE WHEN ${user.createdAt} >= ${currentMonthStart} AND ${user.createdAt} < ${now} THEN 1 ELSE 0 END)`,
                newUsersPreviousMonth: sql<number>`SUM(CASE WHEN ${user.createdAt} >= ${previousMonthStart} AND ${user.createdAt} < ${currentMonthStart} THEN 1 ELSE 0 END)`,
                newUsersTwoMonthsAgo: sql<number>`SUM(CASE WHEN ${user.createdAt} >= ${twoMonthsAgoStart} AND ${user.createdAt} < ${previousMonthStart} THEN 1 ELSE 0 END)`,
                totalUsersGrowth: sql<number>`CASE 
                    WHEN SUM(CASE WHEN ${user.createdAt} < ${previousMonthStart} THEN 1 ELSE 0 END) = 0 THEN 0 
                    ELSE ((SUM(CASE WHEN ${user.createdAt} < ${currentMonthStart} THEN 1 ELSE 0 END) - 
                           SUM(CASE WHEN ${user.createdAt} < ${previousMonthStart} THEN 1 ELSE 0 END)) * 100.0 / 
                           SUM(CASE WHEN ${user.createdAt} < ${previousMonthStart} THEN 1 ELSE 0 END))
                    END`,
                activeUsersGrowth: sql<number>`CASE 
                    WHEN SUM(CASE WHEN ${user.updatedAt} > ${threeMonthsAgo} AND ${user.updatedAt} < ${twoMonthsAgoStart} THEN 1 ELSE 0 END) = 0 THEN 0 
                    ELSE ((SUM(CASE WHEN ${user.updatedAt} > ${threeMonthsAgo} AND ${user.updatedAt} < ${previousMonthStart} THEN 1 ELSE 0 END) - 
                           SUM(CASE WHEN ${user.updatedAt} > ${threeMonthsAgo} AND ${user.updatedAt} < ${twoMonthsAgoStart} THEN 1 ELSE 0 END)) * 100.0 / 
                           SUM(CASE WHEN ${user.updatedAt} > ${threeMonthsAgo} AND ${user.updatedAt} < ${twoMonthsAgoStart} THEN 1 ELSE 0 END))
                    END`,
                newUsersGrowth: sql<number>`CASE 
                    WHEN SUM(CASE WHEN ${user.createdAt} >= ${twoMonthsAgoStart} AND ${user.createdAt} < ${previousMonthStart} THEN 1 ELSE 0 END) = 0 THEN 0 
                    ELSE ((SUM(CASE WHEN ${user.createdAt} >= ${previousMonthStart} AND ${user.createdAt} < ${currentMonthStart} THEN 1 ELSE 0 END) - 
                           SUM(CASE WHEN ${user.createdAt} >= ${twoMonthsAgoStart} AND ${user.createdAt} < ${previousMonthStart} THEN 1 ELSE 0 END)) * 100.0 / 
                           SUM(CASE WHEN ${user.createdAt} >= ${twoMonthsAgoStart} AND ${user.createdAt} < ${previousMonthStart} THEN 1 ELSE 0 END))
                    END`
            })
            .from(user)
            .get();

        return {
            totalUsers: {
                count: result?.totalUsers || 0,
                growth: result?.totalUsersGrowth || 0,
            },
            activeUsers: {
                count: result?.activeUsers || 0,
                growth: result?.activeUsersGrowth || 0,
            },
            newUsers: {
                count: result?.newUsersThisMonth || 0,
                growth: result?.newUsersGrowth || 0,
            }
        };
    }

    static async getAdminCumulativeUsersPerMonth(months: number) {
        const now = new Date();
        const monthsData = [];

        for (let i = 0; i < months; i++) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString();
            const monthName = monthDate.toLocaleString('default', { month: 'long' });
            monthsData.push({ monthEnd, monthName });
        }

        const users = await getDbClient()
            .select({ createdAt: user.createdAt })
            .from(user)
            .execute();

        const results = [];
        for (const monthData of monthsData) {
            const count = users.filter(u => new Date(u.createdAt) <= new Date(monthData.monthEnd)).length;
            results.unshift({ month: monthData.monthName, count });
        }

        return results;
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
        return getDbClient()
            .select({
                count: count(),
                privacy: user.privacy,
            })
            .from(user)
            .groupBy(user.privacy)
            .execute();
    }

    static async findUserByName(name: string) {
        return getDbClient()
            .select()
            .from(user)
            .where(eq(user.name, name))
            .get();
    }

    static async updateUserSettings(userId: number, payload: Record<string, any>) {
        await getDbClient()
            .update(user)
            .set(payload)
            .where(eq(user.id, userId))
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
