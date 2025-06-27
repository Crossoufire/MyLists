import {AchievementDifficulty, MediaType} from "@/lib/server/utils/enums";


export type AchievementStats = { [key in MediaType | "all"]: TierStat[] };


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


export interface TierStat {
    count: number | string;
    tier: AchievementDifficulty | "total";
}


export interface UserTierProgress {
    id: number;
    count: number;
    rarity: number;
    progress: number;
    completed: boolean;
    completedAt: string | null;
    criteria: { count: number };
    difficulty: AchievementDifficulty;
}


export interface UserAchievementDetails {
    id: number;
    name: string;
    mediaType: MediaType;
    tiers: UserTierProgress[];
    description: string | null;
}
