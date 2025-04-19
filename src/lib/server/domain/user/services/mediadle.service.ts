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

    async addMediadleGuess(userId: number, guess: string, mediaService: any) {
        const dailyMediadle = await this.repository.getTodayMoviedle();
        if (!dailyMediadle) {
            throw new Error("No mediadle game available");
        }

        const progress = await this.repository.getUserProgress(userId, dailyMediadle.id);
        if (!progress) {
            throw new Error("User progress not found");
        }

        if (progress.completed) {
            throw new Error("Mediadle game already completed");
        }

        // TODO: bad because of race condition
        const newAttempts = progress.attempts! + 1;

        const selectedMovie = await mediaService.getById(dailyMediadle.mediaId);
        const correct = selectedMovie.name.toLowerCase().trim() === guess.toLowerCase().trim();
        const isCompleted = correct || newAttempts >= dailyMediadle.pixelationLevels!;

        await this.repository.updateUserProgress(userId, dailyMediadle.id, newAttempts, isCompleted, correct);

        let stats = await this.repository.getUserMediadleStats(userId);
        if (!stats) {
            stats = await this.repository.createMediadleStats(userId, dailyMediadle.mediaType);
        }

        // TODO: bad because of race condition
        const newTotalPlayed = stats.totalPlayed! + (isCompleted ? 1 : 0);
        const newTotalWon = stats.totalWon! + (correct ? 1 : 0);
        let newStreak = stats.currentStreak!;

        if (isCompleted) {
            if (correct) {
                newStreak += 1;
            }
            else {
                newStreak = 0;
            }
        }

        const newBestStreak = Math.max(newStreak, stats.bestStreak!);

        // TODO: bad because of race condition
        let newAverageAttempts = stats.averageAttempts!;
        if (isCompleted) {
            if (newTotalPlayed === 1) {
                newAverageAttempts = newAttempts;
            }
            else {
                newAverageAttempts = ((newAverageAttempts * (newTotalPlayed - 1) + newAttempts) / newTotalPlayed);
            }
        }

        // TODO: bad because of race condition
        await this.repository.updateMediadleStats(
            stats.id,
            newTotalPlayed,
            newTotalWon,
            newStreak,
            newBestStreak,
            newAverageAttempts
        );

        return {
            correct,
            attempts: newAttempts,
            completed: isCompleted,
            maxAttempts: dailyMediadle.pixelationLevels!,
        };
    }
}
