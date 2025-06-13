import {db} from "@/lib/server/database/db";
import {and, asc, count, desc, eq, like, sql} from "drizzle-orm";
import {ProviderSearchResults} from "@/lib/server/types/base.types";
import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";
import {followers, user, userMediaSettings} from "@/lib/server/database/schema";
import {getDbClient} from "@/lib/server/database/asyncStorage";


export class UserRepository {
    static async getAdminUserStatistics(dates: any) {
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
            .execute();

        return {
            totalUsers: {
                count: result[0]?.totalUsers || 0,
                growth: result[0]?.totalUsersGrowth || 0,
            },
            activeUsers: {
                count: result[0]?.activeUsers || 0,
                growth: result[0]?.activeUsersGrowth || 0,
            },
            newUsers: {
                count: result[0]?.newUsersThisMonth || 0,
                growth: result[0]?.newUsersGrowth || 0,
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
        const results = await getDbClient()
            .select({ privacy: user.privacy, count: count() })
            .from(user)
            .groupBy(user.privacy)
            .execute();

        return results;
    }

    static async findUserByName(name: string) {
        return getDbClient().select().from(user).where(eq(user.name, name)).execute();
    }

    static async updateUserSettings(userId: number, payload: Record<string, any>) {
        await getDbClient().update(user).set(payload).where(eq(user.id, userId)).execute();
    }

    static async getAdminPaginatedUsers(data: Record<string, any>) {
        const page = data.pageIndex ?? 0;
        const search = data.search ?? "";
        const perPage = data.pageSize ?? 25;
        const sortBy = data.sortBy ?? "updatedAt";
        const sortDesc = data.sortDesc ?? true;
        const offset = page * perPage;

        const totalUsers = await getDbClient()
            .select({ count: count() })
            .from(user)
            .where(like(user.name, `%${search}%`))
            .get();

        const users = await getDbClient()
            .select({
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
                image: user.image,
                privacy: user.privacy,
                updatedAt: user.updatedAt,
                createdAt: user.createdAt,
                emailVerified: user.emailVerified,
                showUpdateModal: user.showUpdateModal,
            })
            .from(user)
            .offset(offset)
            .limit(perPage)
            // @ts-expect-error
            .orderBy(sortDesc ? desc(user[sortBy]) : asc(user[sortBy]))
            .where(like(user.name, `%${search}%`))
            .execute();

        return { items: users, pages: Math.ceil(users.length / perPage), total: totalUsers?.count || 0 };
    }

    static async adminUpdateUser(userId: number, payload: Record<string, any>) {
        await getDbClient().update(user).set(payload).where(eq(user.id, userId)).execute();
    }

    static async adminDeleteUser(_userId: number) {
        // TODO: Delete user (cascade with verification, session, and account), notifications, userMediaSettings, followers,
        //  all media Types, userMediaUpdates...
    }

    static async adminUpdateFeaturesFlag(showUpdateModal: boolean) {
        return getDbClient().update(user).set({ showUpdateModal }).execute();
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
            .execute();

        return { ...userResult, followersCount: followersCount[0]?.count || 0 };
    }

    static async updateNotificationsReadTime(userId: number) {
        return getDbClient().update(user).set({ lastNotifReadTime: sql`CURRENT_TIMESTAMP` }).where(eq(user.id, userId)).execute();
    }

    static async findById(userId: number) {
        const userResult = await getDbClient().query.user.findFirst({
            where: eq(user.id, userId),
            with: { userMediaSettings: true }
        });

        if (!userResult) return null;

        return userResult;
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
        const settings = await db.query.userMediaSettings.findFirst({
            where: and(
                eq(userMediaSettings.userId, userId),
                eq(userMediaSettings.mediaType, mediaType),
                eq(userMediaSettings.active, true),
            ),
        });

        return !!settings;
    }

    static async incrementMediaTypeView(userId: number, mediaType: MediaType) {
        return getDbClient()
            .update(userMediaSettings)
            .set({ views: sql`${userMediaSettings.views} + 1` })
            .where(and(
                eq(userMediaSettings.userId, userId),
                eq(userMediaSettings.mediaType, mediaType),
            ));
    }

    static async isFollowing(userId: number, followedId: number) {
        const result = await getDbClient().query.followers.findFirst({
            where: and(eq(followers.followerId, userId), eq(followers.followedId, followedId)),
        });
        return !!result;
    }

    static async incrementProfileView(userId: number) {
        return getDbClient()
            .update(user)
            .set({ profileViews: sql`${user.profileViews} + 1` })
            .where(eq(user.id, userId));
    }

    static async getUserFollowers({ userId, limit = 8 }: { userId: number, limit?: number }) {
        const totalCountResult = await getDbClient()
            .select({ value: sql<number>`count()` })
            .from(followers)
            .where(eq(followers.followedId, userId));

        const total = totalCountResult[0]?.value ?? 0;

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

    static async getUserFollows({ userId, limit = 8 }: { userId: number, limit?: number }) {
        const totalCountResult = await getDbClient()
            .select({ value: sql<number>`count()` })
            .from(followers)
            .where(eq(followers.followerId, userId));

        const total = totalCountResult[0]?.value ?? 0;

        const followedUsers = await getDbClient()
            .select({
                id: user.id,
                username: user.name,
                image: user.image,
                privacy: user.privacy,
            })
            .from(followers)
            .innerJoin(user, eq(followers.followedId, user.id))
            .where(eq(followers.followerId, userId))
            .orderBy(asc(user.name))
            .limit(limit);

        return { total: total, follows: followedUsers };
    }

    static async searchUsers(query: string, page: number = 1) {
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

        return dbUsers.map((user) => ({ ...user, itemType: ApiProviderType.USERS })) as ProviderSearchResults[]
    }
}
