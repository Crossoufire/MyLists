import {AchievementsRepository} from "@/lib/server/repositories/user/achievements.repository";


export class AchievementsService {
    constructor(private achievementsRepository: typeof AchievementsRepository) {
    }

    async getAllAchievements() {
        return this.achievementsRepository.getAllAchievements();
    }

    async getAchievement(id: number) {
        return this.achievementsRepository.getAchievement(id);
    }

    async getAchievementByCodeName(codeName: string) {
        return this.achievementsRepository.getAchievementByCodeName(codeName);
    }

    async getAchievementTiers(achievementId: number) {
        return this.achievementsRepository.getAchievementTiers(achievementId);
    }

    async getUserAchievements(userId: string) {
        return this.achievementsRepository.getUserAchievements(userId);
    }

    async getUserAchievement(userId: string, achievementId: number) {
        return this.achievementsRepository.getUserAchievement(userId, achievementId);
    }

    async updateUserAchievementProgress(userId: string, achievementId: number, progress: number, count: number) {
        return this.achievementsRepository.updateUserAchievementProgress(userId, achievementId, progress, count);
    }

    async completeUserAchievement(userId: string, achievementId: number, tierId: number) {
        return this.achievementsRepository.completeUserAchievement(userId, achievementId, tierId);
    }
}
