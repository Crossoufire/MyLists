import {db} from "@/lib/server/database/db";
import {and, count, eq, max, sql} from "drizzle-orm";
import {AchievementDifficulty} from "@/lib/server/utils/enums";
import {achievement, achievementTier, userAchievement} from "@/lib/server/database/schema";


export class AchievementsRepository {

    static getSQLTierOrdering() {
        return sql<number>`CASE ${achievementTier.difficulty}
            WHEN 'bronze' THEN 1
            WHEN 'silver' THEN 2
            WHEN 'gold' THEN 3
            WHEN 'platinum' THEN 4
            ELSE 0
        END`;
    }

    static async getDifficultySummary(userId: number) {
        const tierOrder = this.getSQLTierOrdering();

        const subq = db
            .select({ achievementId: userAchievement.achievementId, maxTierOrder: max(tierOrder).as("maxTierOrder") })
            .from(userAchievement)
            .innerJoin(achievementTier, eq(userAchievement.tierId, achievementTier.id))
            .where(and(eq(userAchievement.userId, userId), eq(userAchievement.completed, true)))
            .groupBy(userAchievement.achievementId)
            .as("subq");

        const results = await db
            .select({ difficulty: achievementTier.difficulty, count: count().mapWith(Number) })
            .from(achievementTier)
            .innerJoin(subq, and(eq(achievementTier.achievementId, subq.achievementId), eq(tierOrder, subq.maxTierOrder)))
            .groupBy(achievementTier.difficulty)
            .orderBy(tierOrder);

        return results;
    }

    static async getAchievementsDetails(userId: number, limit = 6) {
        const tierOrder = this.getSQLTierOrdering();

        const highestCompletedTierSubquery = db
            .select({ achievementId: userAchievement.achievementId, maxTierOrder: max(tierOrder).as("maxTierOrder") })
            .from(userAchievement)
            .innerJoin(achievementTier, eq(userAchievement.tierId, achievementTier.id))
            .where(and(eq(userAchievement.userId, userId), eq(userAchievement.completed, true)))
            .groupBy(userAchievement.achievementId)
            .as("highestCompleted");

        const results = await db
            .select({
                name: achievement.name,
                description: achievement.description,
                difficulty: achievementTier.difficulty,
            })
            .from(achievement)
            .innerJoin(highestCompletedTierSubquery, eq(achievement.id, highestCompletedTierSubquery.achievementId))
            .innerJoin(achievementTier, eq(achievement.id, achievementTier.achievementId))
            .where(eq(tierOrder, highestCompletedTierSubquery.maxTierOrder))
            .orderBy(sql`RANDOM()`)
            .limit(limit);

        return results;
    }

    static async countPlatinumAchievements(userId: number) {
        const result = await db
            .select({ count: count() })
            .from(userAchievement)
            .innerJoin(achievementTier, eq(userAchievement.tierId, achievementTier.id))
            .where(and(
                eq(userAchievement.userId, userId),
                eq(userAchievement.completed, true),
                eq(achievementTier.difficulty, AchievementDifficulty.PLATINUM)
            ))

        return result[0]?.count ?? 0;
    }
}
