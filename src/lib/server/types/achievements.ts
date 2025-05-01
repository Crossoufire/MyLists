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
