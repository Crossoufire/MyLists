import {AchievementTier} from "@/lib/types/zod.schema.types";
import {AchievementDifficulty, MediaType} from "@/lib/utils/enums";


export type Achievement = {
    id: number,
    name: string,
    codeName: string,
    description: string,
    value: string | null,
    tiers: AchievementTier[],
    mediaType: MediaType | null,
}


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
