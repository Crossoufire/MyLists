import {AchievementDifficulty, MediaType} from "@/lib/server/utils/enums";


interface TierData {
    criteria: { count: number };
    difficulty: AchievementDifficulty;
}


export interface AchievementData {
    name: string;
    codeName: string;
    tiers: TierData[];
    description: string;
    mediaType: MediaType;
    value?: number | string;
}


export interface Achievement {
    id: number
    name: string
    mediaType: MediaType | null
    codeName: string
    description: string
    value: string | null
    tiers: AchievementTier[]
}


export interface AchievementTier {
    id: number
    achievementId: number
    difficulty: AchievementDifficulty
    criteria: {
        count: any,
    }
    rarity: number | null
}