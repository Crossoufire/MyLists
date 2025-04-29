import {pixelateImage} from "@/lib/server/utils/image-pixelation";
import {MediadleRepository} from "@/lib/server/domain/user/repositories/mediadle.repository";


export class MediadleService {
    constructor(private repository: typeof MediadleRepository) {
    }

    async getAdminAllUsersStats(data: Record<string, any>) {
        return this.repository.getAdminAllUsersStats(data);
    }

    async getUserMediadleStats(userId: number) {
        const userMediadleStats = await this.repository.getUserMediadleStats(userId);
        if (!userMediadleStats) {
            return null;
        }

        const attempts = await this.repository.getUserAttempts(userId);

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
            nonPixelatedCover: userProgress.completed ? selectedMovie?.imageCover : null,
        };
    }

    async addMediadleGuess(userId: number, guess: string, mediaService: any) {
        const dailyMediadle = await this.repository.getTodayMoviedle();
        if (!dailyMediadle) {
            throw new Error("No game available for today");
        }

        const progress = await this.repository.getUserProgress(userId, dailyMediadle.id);
        if (!progress || progress.completed) {
            throw new Error("User progress not found or game already completed");
        }

        const selectedMovie = await mediaService.getById(dailyMediadle.mediaId);
        const correct = selectedMovie.name.toLowerCase().trim() === guess.toLowerCase().trim();

        const potentialAttempts = progress.attempts! + 1;
        const isCompleted = correct || (potentialAttempts >= dailyMediadle.pixelationLevels!);

        const updatedProgress = await this.repository.incrementUserAttempts(userId, dailyMediadle.id, isCompleted, correct);
        if (!updatedProgress) {
            throw new Error("Game is already completed.");
        }

        if (updatedProgress.completed) {
            let stats = await this.repository.getUserMediadleStats(userId);
            if (!stats) {
                stats = await this.repository.createMediadleStats(userId, dailyMediadle.mediaType);
            }
            await this.repository.updateMediadleStats(stats.id, isCompleted, correct, updatedProgress.attempts!);
        }

        return {
            correct,
            completed: isCompleted,
            attempts: updatedProgress.attempts!,
            maxAttempts: dailyMediadle.pixelationLevels!,
        };
    }
}
