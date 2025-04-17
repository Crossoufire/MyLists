import {pixelateImage} from "@/lib/server/utils/image-pixelation";
import {MediadleRepository} from "@/lib/server/domain/user/repositories/mediadle.repository";


export class MediadleService {
    constructor(private repository: typeof MediadleRepository) {
    }

    async getUserMediadleStats(userId: number) {
        const userMediadleStats = await this.repository.getUserMediadleStats(userId);
        if (!userMediadleStats) {
            return null;
        }

        const attempts = await this.repository.getUserAttemptsData(userId);

        return { ...userMediadleStats, attempts };
    }

    async getDailyMediadleData(userId: number, mediaService: any) {
        let dailyMediadle = await this.repository.getTodayMoviedle();
        if (!dailyMediadle) {
            dailyMediadle = await this.repository.createDailyMoviedle();
        }

        let userProgress = await this.repository.getUserProgress(userId, dailyMediadle.id);
        if (!userProgress) {
            userProgress = await this.repository.createUserProgress(userId, dailyMediadle.id);
        }

        const selectedMovie = await mediaService.getById(dailyMediadle.mediaId);
        const pixelationLevel = Math.min(dailyMediadle.pixelationLevels!, userProgress.attempts! + 1);
        const userMediadleStats = await this.getUserMediadleStats(userId);

        const pixelatedCover = await pixelateImage(selectedMovie?.imageCover, pixelationLevel);

        return {
            pixelatedCover,
            stats: userMediadleStats,
            mediadleId: dailyMediadle.id,
            mediaId: dailyMediadle.mediaId,
            attempts: userProgress.attempts!,
            completed: userProgress.completed!,
            succeeded: userProgress.succeeded!,
            maxAttempts: dailyMediadle.pixelationLevels!,
            nonPixelatedCover: userProgress.completed ? selectedMovie?.image : null,
        };
    }
}
