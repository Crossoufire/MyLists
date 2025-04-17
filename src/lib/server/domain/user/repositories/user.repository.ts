import {db} from "@/lib/server/database/db";
import {and, asc, count, eq, like, sql} from "drizzle-orm";
import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";
import {followers, user, userMediaSettings} from "@/lib/server/database/schema";
import {ProviderSearchResults} from "@/lib/server/domain/media-providers/interfaces/types";


export class UserRepository {
    static async findByUsername(username: string) {
        const userResult = await db.query.user.findFirst({
            where: eq(user.name, username),
            with: { userMediaSettings: true }
        });

        if (!userResult) return null;

        const followersCount = await db
            .select({ count: count() })
            .from(followers)
            .where(eq(followers.followedId, userResult.id))
            .execute();

        return { ...userResult, followersCount: followersCount[0]?.count || 0 };
    }

    static async updateNotificationsReadTime(userId: number) {
        return db.update(user).set({ lastNotifReadTime: sql`now()` }).where(eq(user.id, userId)).execute();
    }
    
    static async findById(userId: number) {
        const userResult = await db.query.user.findFirst({
            where: eq(user.id, userId),
            with: { userMediaSettings: true }
        });

        if (!userResult) return null;

        return userResult;
    }

    static async updateFollowStatus(userId: number, followedId: number) {
        const currentFollow = await db.query.followers.findFirst({
            where: and(eq(followers.followerId, userId), eq(followers.followedId, followedId)),
        });

        if (!currentFollow) {
            await db.insert(followers).values({ followerId: userId, followedId: followedId });
        }
        else {
            await db.delete(followers).where(and(eq(followers.followerId, userId), eq(followers.followedId, followedId)));
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
        return db.update(userMediaSettings).set({ views: sql`${userMediaSettings.views} + 1` }).where(and(
            eq(userMediaSettings.userId, userId),
            eq(userMediaSettings.mediaType, mediaType),
        ));
    }

    static async isFollowing(userId: number, followedId: number) {
        const result = await db.query.followers.findFirst({
            where: and(eq(followers.followerId, userId), eq(followers.followedId, followedId)),
        });
        return !!result;
    }

    static async incrementProfileView(userId: number) {
        return db.update(user).set({ profileViews: sql`${user.profileViews} + 1` }).where(eq(user.id, userId));
    }

    static async getUserFollowers({ userId, limit = 8 }: { userId: number, limit?: number }) {
        const totalCountResult = await db
            .select({ value: sql<number>`count()` })
            .from(followers)
            .where(eq(followers.followedId, userId));

        const total = totalCountResult[0]?.value ?? 0;

        const followersUsers = await db
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
        const totalCountResult = await db
            .select({ value: sql<number>`count()` })
            .from(followers)
            .where(eq(followers.followerId, userId));

        const total = totalCountResult[0]?.value ?? 0;

        const followedUsers = await db
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
        const dbUsers = await db
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
