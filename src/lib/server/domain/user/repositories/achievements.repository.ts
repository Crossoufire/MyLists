import {db} from "@/lib/server/database/db";
import {AchievementDifficulty} from "@/lib/server/utils/enums";
import {AchievementData} from "@/lib/server/types/achievements";
import {and, asc, count, eq, getTableColumns, inArray, max, sql} from "drizzle-orm";
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

    static async seedAchievements(achievementsDefinition: AchievementData[]) {
        await db.transaction(async (tx) => {
            for (const achievementData of achievementsDefinition) {
                const existingAchievement = tx
                    .select()
                    .from(achievement)
                    .where(eq(achievement.codeName, achievementData.codeName))
                    .get();

                let currentAchievement: typeof achievement.$inferSelect | undefined;

                if (existingAchievement) {
                    currentAchievement = existingAchievement;
                    await tx
                        .update(achievement)
                        .set({
                            name: achievementData.name,
                            mediaType: achievementData.mediaType,
                            value: achievementData.value?.toString(),
                            description: achievementData.description,
                        })
                        .where(eq(achievement.id, currentAchievement.id))
                }
                else {
                    const newAchievements = await tx
                        .insert(achievement)
                        .values({
                            name: achievementData.name,
                            codeName: achievementData.codeName,
                            mediaType: achievementData.mediaType,
                            value: achievementData.value?.toString(),
                            description: achievementData.description,
                        })
                        .returning();
                    currentAchievement = newAchievements[0];
                }

                const existingTiers = await tx
                    .select()
                    .from(achievementTier)
                    .where(eq(achievementTier.achievementId, currentAchievement.id))

                const newDifficulties = new Set(achievementData.tiers.map((tier) => tier.difficulty));
                const existingTierDiff = new Set(existingTiers.map((tier) => tier.difficulty));

                const difficultiesToRemove = Array.from(existingTierDiff).filter((d) => !newDifficulties.has(d));
                if (difficultiesToRemove.length > 0) {
                    await tx
                        .delete(achievementTier)
                        .where(and(
                            eq(achievementTier.achievementId, currentAchievement.id),
                            inArray(achievementTier.difficulty, difficultiesToRemove),
                        ))
                }

                for (const tierData of achievementData.tiers) {
                    const existingTier = existingTiers.find((tier) => tier.difficulty === tierData.difficulty);
                    if (existingTier) {
                        await tx
                            .update(achievementTier)
                            .set({ criteria: tierData.criteria })
                            .where(eq(achievementTier.id, existingTier.id))
                    }
                    else {
                        await tx
                            .insert(achievementTier)
                            .values({
                                achievementId: currentAchievement.id,
                                difficulty: tierData.difficulty,
                                criteria: tierData.criteria,
                            })
                    }
                }
            }

            const mediaTypeAchievements = await tx
                .select({
                    id: achievement.id,
                    codeName: achievement.codeName,
                })
                .from(achievement)
                .where(eq(achievement.mediaType, achievementsDefinition[0].mediaType))

            const definedCodeNames = new Set(achievementsDefinition.map((ad) => ad.codeName));
            const achievementsToRemove = mediaTypeAchievements.filter(
                (existingAch) => !definedCodeNames.has(existingAch.codeName),
            );

            if (achievementsToRemove.length > 0) {
                const idsToRemove = achievementsToRemove.map((ach) => ach.id);
                await tx
                    .delete(achievementTier)
                    .where(inArray(achievementTier.achievementId, idsToRemove))
                await tx
                    .delete(achievement)
                    .where(inArray(achievement.id, idsToRemove))
            }
        });
    }

    static async adminUpdateAchievement(achievementId: number, payload: Record<string, any>) {
        return db.update(achievement).set(payload).where(eq(achievement.id, achievementId));
    }

    static async adminUpdateTiers(payloads: Record<string, any>[]) {
        return db.transaction(async (tx) => {
            for (const payload of payloads) {
                await tx
                    .update(achievementTier)
                    .set({ criteria: payload.criteria })
                    .where(eq(achievementTier.id, payload.id));
            }
        });
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

    static async getUserAchievementStats(userId: number) {
        const tierOrder = this.getSQLTierOrdering();

        const subq = db
            .select({
                mediaType: achievement.mediaType,
                achievementId: userAchievement.achievementId,
                maxTierOrder: max(tierOrder).as("maxTierOrder"),
            })
            .from(userAchievement)
            .innerJoin(achievementTier, eq(userAchievement.tierId, achievementTier.id))
            .innerJoin(achievement, eq(userAchievement.achievementId, achievement.id))
            .where(and(eq(userAchievement.userId, userId), eq(userAchievement.completed, true)))
            .groupBy(achievement.mediaType, userAchievement.achievementId)
            .as("subq");

        const completedResult = await db
            .select({
                mediaType: subq.mediaType,
                count: count().as("count"),
                difficulty: achievementTier.difficulty,
            })
            .from(achievementTier)
            .innerJoin(subq, and(eq(achievementTier.achievementId, subq.achievementId), eq(tierOrder, subq.maxTierOrder)))
            .groupBy(subq.mediaType, achievementTier.difficulty)
            .orderBy(subq.mediaType, tierOrder);

        const totalAchievementsResult = await db
            .select({ total: count().as("total"), mediaType: achievement.mediaType })
            .from(achievement)
            .groupBy(achievement.mediaType);

        return { completedResult, totalAchievementsResult };
    }

    static async getAllUserAchievements(userId: number) {
        const tierOrder = this.getSQLTierOrdering();

        const results = await db
            .select({
                tier: achievementTier,
                achievement: achievement,
                userProgress: userAchievement,
            })
            .from(achievement)
            .innerJoin(achievementTier, eq(achievement.id, achievementTier.achievementId))
            .leftJoin(userAchievement, and(eq(achievementTier.id, userAchievement.tierId), eq(userAchievement.userId, userId)))
            .orderBy(achievement.id, tierOrder);

        return results;
    }

    static async getAllAchievements() {
        const tierOrder = this.getSQLTierOrdering();

        const flatResults = await db
            .select({
                ...getTableColumns(achievement),
                tier: getTableColumns(achievementTier),
            })
            .from(achievement)
            .innerJoin(achievementTier, eq(achievement.id, achievementTier.achievementId))
            .orderBy(asc(achievement.id), tierOrder);

        type GroupedAchievement = Omit<typeof flatResults[0], "tier"> & {
            tiers: typeof flatResults[0]["tier"][];
        };

        const groupedAchievements = flatResults.reduce<Record<number, GroupedAchievement>>((acc, row) => {
            const { tier, ...achievementData } = row;
            const achievementId = achievementData.id;

            if (!acc[achievementId]) {
                acc[achievementId] = { ...achievementData, tiers: [] };
            }

            acc[achievementId].tiers.push(tier);

            return acc;
        }, {});

        return Object.values(groupedAchievements);
    }
}
