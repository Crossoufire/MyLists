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
    codeName: string
    description: string
    value: string | null
    tiers: AchievementTier[]
    mediaType: MediaType | null
}


export interface AchievementTier {
    id: number
    achievementId: number
    rarity: number | null
    criteria: { count: any }
    difficulty: AchievementDifficulty
}