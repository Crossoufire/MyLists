import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";


export class AchievementsService {
    constructor(private achievementsRepository: typeof AchievementsRepository) {
    }

    async getDifficultySummary(userId: number) {
        return this.achievementsRepository.getDifficultySummary(userId);
    }

    async getAchievementsDetails(userId: number, limit = 6) {
        return this.achievementsRepository.getAchievementsDetails(userId, limit);
    }
}
