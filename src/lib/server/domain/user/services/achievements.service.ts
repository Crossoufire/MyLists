import {AchievementData} from "@/lib/server/types/achievements";
import {AchievementDifficulty, MediaType} from "@/lib/server/utils/enums";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";


export class AchievementsService {
    constructor(private repository: typeof AchievementsRepository) {
    }

    async seedAchievements(achievements: AchievementData[]) {
        return this.repository.seedAchievements(achievements);
    }

    async adminUpdateAchievement(achievementId: number, payload: Record<string, any>) {
        return this.repository.adminUpdateAchievement(achievementId, payload);
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

    async getAllAchievements() {
        return this.repository.getAllAchievements();
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
                    id: ach.id,
                    name: ach.name,
                    description: ach.description,
                    mediaType: ach.mediaType!,
                    tiers: [],
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
}


interface TierStat {
    count: number | string;
    tier: AchievementDifficulty | "total";
}


type AchievementStats = { [key in MediaType | "all"]: TierStat[] };


interface UserTierProgress {
    id: number;
    count: number;
    rarity: number;
    progress: number;
    completed: boolean;
    completedAt: string | null;
    criteria: { count: number };
    difficulty: AchievementDifficulty;
}


interface UserAchievementDetails {
    id: number;
    name: string;
    mediaType: MediaType;
    tiers: UserTierProgress[];
    description: string | null;
}