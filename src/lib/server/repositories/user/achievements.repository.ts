import {asc, eq, sql} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {achievement, achievementTier, userAchievement} from "@/lib/server/database/schema";


export class AchievementsRepository {
    static async getAllAchievements() {
        return db.query.achievement.findMany({
            orderBy: [asc(achievement.name)],
        });
    }

    static async getAchievement(id: number) {
        return db.query.achievement.findFirst({
            where: eq(achievement.id, id),
        });
    }

    static async getAchievementByCodeName(codeName: string) {
        return db.query.achievement.findFirst({
            where: eq(achievement.codeName, codeName),
        });
    }

    static async getAchievementTiers(achievementId: number) {
        return db.query.achievementTier.findMany({
            where: eq(achievementTier.achievementId, achievementId),
            orderBy: [asc(achievementTier.difficulty)],
        });
    }

    static async getUserAchievements(userId: string) {
        return db.query.userAchievement.findMany({
            // @ts-ignore
            where: eq(userAchievement.userId, userId),
        });
    }

    static async getUserAchievement(userId: string, achievementId: number) {
        return db.query.userAchievement.findFirst({
            // @ts-ignore
            where: sql`${userAchievement.userId} = ${userId} AND ${userAchievement.achievementId} = ${achievementId}`,
        });
    }

    static async updateUserAchievementProgress(userId: string, achievementId: number, progress: number, count: number) {
        // Check if user achievement exists
        const userAchievementData = await this.getUserAchievement(userId, achievementId);

        if (userAchievementData) {
            // Update existing record
            return db.update(userAchievement)
                .set({
                    progress,
                    count,
                    // @ts-ignore
                    lastCalculatedAt: Date.now().toString()
                })
                .where(sql`${userAchievement.userId} = ${userId} AND ${userAchievement.achievementId} = ${achievementId}`);
        }
        else {
            // Create new record
            return db.insert(userAchievement).values({
                // @ts-ignore
                userId,
                achievementId,
                progress,
                count,
                completed: 0,
                // @ts-ignore
                lastCalculatedAt: Date.now().toString()
            });
        }
    }

    static async completeUserAchievement(userId: string, achievementId: number, tierId: number) {
        return db.update(userAchievement)
            .set({
                // @ts-ignore
                completed: 1,
                // @ts-ignore
                completedAt: Date.now().toString(),
                // @ts-ignore
                tierId
            })
            .where(sql`${userAchievement.userId} = ${userId} AND ${userAchievement.achievementId} = ${achievementId}`);
    }
} 