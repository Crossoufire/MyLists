import {MediadleRepository} from "@/lib/server/domain/user/repositories/mediadle.repository";


export class MediadleService {
    constructor(private repository: typeof MediadleRepository) {
    }

    async getTodayMoviedle() {
        return this.repository.getTodayMoviedle();
    }

    async createDailyMoviedle() {
        return this.repository.createDailyMoviedle();
    }

    async getUserProgress(userId: number, mediadleId: number) {
        return this.repository.getUserProgress(userId, mediadleId);
    }

    async createUserProgress(userId: number, mediadleId: number) {
        return this.repository.createUserProgress(userId, mediadleId);
    }

    async getUserMediadleStats(userId: number) {
        const userMediadleStats = await this.repository.getUserMediadleStats(userId);
        if (!userMediadleStats) {
            return null;
        }

        const attempts = await this.getUserAttemptsData(userId);

        return { ...userMediadleStats, attempts };
    }

    async getUserAttemptsData(userId: number) {
        return this.repository.getUserAttemptsData(userId);
    }
}
