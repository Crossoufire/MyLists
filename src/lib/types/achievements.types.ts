import {AchievementTier} from "@/lib/types/zod.schema.types";
import {AchievementDifficulty, MediaType} from "@/lib/server/utils/enums";


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
        rarity: number;
        progress: number;
        completed: boolean;
        completedAt: string | null;
        criteria: { count: number };
        difficulty: AchievementDifficulty;
    }[];
}


type TierData = {
    criteria: { count: number },
    difficulty: AchievementDifficulty,
}
