import {db} from "@/lib/server/database/db";
import {and, asc, eq, like, sql} from "drizzle-orm";
import {followers, user} from "@/lib/server/database/schema";
import {ApiProviderType} from "@/lib/server/utils/enums";
import {ProviderSearchResults} from "@/lib/server/media-providers/interfaces/types";


export class UserRepository {
    static async findByUsername(username: string) {
        const userResult = await db.query.user.findFirst({
            where: eq(user.name, username),
            with: { userMediaSettings: true }
        });

        if (!userResult) return null;

        const followersCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(followers)
            .where(eq(followers.followerId, userResult.id))
            .execute();

        return { ...userResult, followersCount: followersCount[0]?.count || 0 };
    }

    static async isFollowing(userId: number, followedId: number) {
        return !!db.query.followers.findFirst({
            where: and(eq(followers.followerId, userId), eq(followers.followedId, followedId)),
        });
    }

    static async incrementProfileView(userId: number) {
        return db.update(user).set({ profileViews: sql`${user.profileViews} + 1` }).where(eq(user.id, userId));
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
