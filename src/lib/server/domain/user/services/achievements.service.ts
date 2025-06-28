import {sql} from "drizzle-orm";
import {userAchievement} from "@/lib/server/database/schema";
import {MediaService} from "@/lib/server/types/services.types";
import {AchievementDifficulty, MediaType} from "@/lib/server/utils/enums";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";
import {Achievement, AchievementData, AchievementStats, TierStat, UserAchievementDetails, UserTierProgress} from "@/lib/server/types/achievements.types";


export class AchievementsService {
    constructor(private repository: typeof AchievementsRepository) {
    }

    async seedAchievements(achievements: AchievementData[]) {
        return this.repository.seedAchievements(achievements);
    }

    async adminUpdateAchievement(achievementId: number, payload: Record<string, any>) {
        await this.repository.adminUpdateAchievement(achievementId, payload);
    }

    async adminUpdateTiers(payloads: Record<string, any>[]) {
        return this.repository.adminUpdateTiers(payloads);
    }

    async getDifficultySummary(userId: number) {
        return this.repository.getDifficultySummary(userId);
    }

    async getAchievementsDetails(userId: number, limit = 6) {
        return this.repository.getAchievementsDetails(userId, limit);
    }

    async allUsersAchievements() {
        return this.repository.allUsersAchievements();
    }

    async getUserAchievementStats(userId: number) {
        const { completedResult, totalAchievementsResult } = await this.repository.getUserAchievementStats(userId);

        const mediaTypes = Object.values(MediaType);
        const difficulties = Object.values(AchievementDifficulty);

        const totalAchievementsMap = new Map(totalAchievementsResult.map((item) => [item.mediaType, item.total]));
        const completedCountsMap = new Map(completedResult.map((item) => [`${item.mediaType}-${item.difficulty}`, item.count]));
        const allDifficultySums = Object.fromEntries(
            difficulties.map((diff) => [diff, 0])
        ) as Record<AchievementDifficulty, number>;

        const results = {
            all: [] as TierStat[],
            ...Object.fromEntries(mediaTypes.map((mt) => [mt, [] as TierStat[]])),
        } as AchievementStats;

        let grandTotal = 0;
        let grandTotalGained = 0;
        for (const mediaType of mediaTypes) {
            const mediaTypeStats: TierStat[] = [];
            let mediaTypeTotalGained = 0;

            for (const difficulty of difficulties) {
                const count = completedCountsMap.get(`${mediaType}-${difficulty}`) || 0;
                mediaTypeStats.push({ tier: difficulty, count });
                allDifficultySums[difficulty] += count;
                mediaTypeTotalGained += count;
            }

            const mediaTypeAchievementTotal = totalAchievementsMap.get(mediaType) || 0;
            mediaTypeStats.push({ tier: "total", count: `${mediaTypeTotalGained}/${mediaTypeAchievementTotal}` });

            results[mediaType] = mediaTypeStats;

            grandTotal += mediaTypeAchievementTotal;
            grandTotalGained += mediaTypeTotalGained;
        }

        const allStats: TierStat[] = [];
        for (const difficulty of difficulties) {
            allStats.push({ tier: difficulty, count: allDifficultySums[difficulty] });
        }

        allStats.push({ tier: "total", count: `${grandTotalGained}/${grandTotal}` });
        results["all"] = allStats;

        return results;
    }

    async getAllUserAchievements(userId: number) {
        const results = await this.repository.getAllUserAchievements(userId);

        const achievementsMap = new Map<number, UserAchievementDetails>();
        for (const row of results) {
            const tier = row.tier;
            const ach = row.achievement;
            const progress = row.userProgress;

            let achievementEntry = achievementsMap.get(ach.id);
            if (!achievementEntry) {
                achievementEntry = {
                    tiers: [],
                    id: ach.id,
                    name: ach.name,
                    mediaType: ach.mediaType!,
                    description: ach.description,
                };
                achievementsMap.set(ach.id, achievementEntry);
            }

            const tierProgress: UserTierProgress = {
                id: tier.id,
                rarity: tier.rarity!,
                criteria: tier.criteria,
                difficulty: tier.difficulty,
                count: progress?.count ?? 0,
                progress: progress?.progress ?? 0,
                completed: progress?.completed ?? false,
                completedAt: progress?.completedAt ?? null,
            };

            achievementEntry.tiers.push(tierProgress);

        }

        const finalAchievements = Array.from(achievementsMap.values());
        finalAchievements.sort((a, b) => {
            if (a.mediaType !== b.mediaType) {
                return (a.mediaType).localeCompare(b.mediaType);
            }
            return a.name.localeCompare(b.name);
        });

        return finalAchievements;
    }

    async getMediaAchievements(mediaType: MediaType) {
        return this.repository.getMediaAchievements(mediaType);
    }

    async calculateAchievement(achievement: Achievement, mediaService: MediaService) {
        const achievementCTE = mediaService.getAchievementCte(achievement);

        for (const tier of achievement.tiers) {
            const valueNeeded = tier.criteria.count;

            const count = sql`calculation.value`;
            const completed = sql`calculation.value >= ${valueNeeded}`;
            const progress = sql`CASE
                WHEN (calculation.value / ${valueNeeded}) * 100.0 < 100.0
                THEN (calculation.value / ${valueNeeded}) * 100.0
                ELSE 100.0
            END`;
            const completedAt = sql`CASE 
                WHEN calculation.value >= ${valueNeeded} AND ${userAchievement.completed} = false
                THEN datetime('now')
                ELSE ${userAchievement.completedAt}
            END`;

            await this.repository.updateAchievement(tier, achievementCTE, completed, count, progress, completedAt);
            await this.repository.insertAchievement(tier, achievementCTE, completed, count, progress);
        }
    }
}
