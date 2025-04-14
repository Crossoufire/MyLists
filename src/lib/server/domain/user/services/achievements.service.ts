import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";


export class AchievementsService {
    constructor(private repository: typeof AchievementsRepository) {
    }

    async getDifficultySummary(userId: number) {
        return this.repository.getDifficultySummary(userId);
    }

    async getAchievementsDetails(userId: number, limit = 6) {
        return this.repository.getAchievementsDetails(userId, limit);
    }
}
