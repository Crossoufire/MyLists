import {AchievementDifficulty, MediaType} from "@/lib/utils/enums";
import {AchievementsService} from "@/lib/server/domain/achievements/achievements.service";


export type Achievement = Awaited<ReturnType<AchievementsService["allUsersAchievements"]>>[number];


export type AchievementSeedData = {
    name: string,
    codeName: string,
    description: string,
    mediaType: MediaType,
    value?: number | string,
    tiers: readonly TierData[],
}


export type UserAchievementDetails = {
    id: number;
    name: string;
    mediaType: MediaType;
    description: string | null;
    tiers: {
        id: number;
        count: number;
        progress: number;
        completed: boolean;
        rarity: number | null;
        completedAt: string | null;
        criteria: { count: number };
        difficulty: AchievementDifficulty;
    }[];
}


type TierData = {
    criteria: { count: number },
    difficulty: AchievementDifficulty,
}
