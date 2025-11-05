import {AchievementDifficulty, MediaType} from "@/lib/utils/enums";
import {AchievementsService} from "@/lib/server/domain/achievements/achievements.service";


export type Achievement = Awaited<ReturnType<AchievementsService["getAllAchievements"]>>[number];


export type AchievementSeedData = {
    name: string,
    codeName: string,
    description: string,
    mediaType: MediaType,
    value?: number | string,
    tiers: readonly TierData[],
}


type TierData = {
    criteria: { count: number },
    difficulty: AchievementDifficulty,
}
