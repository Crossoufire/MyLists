import {db} from "@/lib/server/database/db";
import {MediaType} from "@/lib/server/utils/enums";
import {and, eq, gte, isNotNull, notInArray, sql} from "drizzle-orm";
import {dailyMediadle, mediadleStats, movies, userMediadleProgress} from "@/lib/server/database/schema";


export class MediadleRepository {
    static async getTodayMoviedle() {
        const today = new Date().toISOString().slice(0, 10);
        return db
            .select()
            .from(dailyMediadle)
            .where(sql`${dailyMediadle.date} >= ${today}`)
            .get();
    }

    static async createDailyMoviedle() {
        const alreadyUsedMovies = await db
            .select({ mediaId: dailyMediadle.mediaId })
            .from(dailyMediadle)
            .where(eq(dailyMediadle.mediaType, MediaType.MOVIES))
            .limit(200)
            .execute();
        const alreadyUsedMoviesIds = alreadyUsedMovies.map(row => row.mediaId);

        const selectedMovie = await db
            .select()
            .from(movies)
            .where(and(notInArray(movies.id, alreadyUsedMoviesIds), gte(movies.voteCount, 700)))
            .orderBy(sql`RANDOM()`)
            .get();

        if (!selectedMovie) {
            throw new Error("No new movies found to create a daily mediadle.");
        }

        const [newMoviedle] = await db
            .insert(dailyMediadle)
            .values({
                mediaId: selectedMovie.id,
                mediaType: MediaType.MOVIES,
                date: new Date().toISOString().slice(0, 10),
            })
            .returning()

        return newMoviedle!;
    }

    static async getUserProgress(userId: number, mediadleId: number) {
        return db
            .select()
            .from(userMediadleProgress)
            .where(and(eq(userMediadleProgress.userId, userId), eq(userMediadleProgress.dailyMediadleId, mediadleId)))
            .get();
    }

    static async createUserProgress(userId: number, mediadleId: number) {
        const [newUserProgress] = await db
            .insert(userMediadleProgress)
            .values({
                userId,
                dailyMediadleId: mediadleId,
                attempts: 0,
                completed: false,
                succeeded: false,
            })
            .returning()

        return newUserProgress!;
    }

    static async updateUserProgress(userId: number, mediadleId: number, attempts: number, completed: boolean, succeeded: boolean) {
        const [updatedProgress] = await db
            .update(userMediadleProgress)
            .set({
                attempts,
                completed,
                succeeded,
                completionTime: completed ? sql`CURRENT_TIMESTAMP` : undefined,
            })
            .where(and(eq(userMediadleProgress.userId, userId), eq(userMediadleProgress.dailyMediadleId, mediadleId)))
            .returning();

        return updatedProgress!;
    }

    static async getUserMediadleStats(userId: number) {
        return db
            .select({
                id: mediadleStats.id,
                totalWon: mediadleStats.totalWon,
                currentStreak: mediadleStats.streak,
                bestStreak: mediadleStats.bestStreak,
                totalPlayed: mediadleStats.totalPlayed,
                averageAttempts: mediadleStats.averageAttempts,
                winRate: sql<number>`
                    CASE 
                        WHEN ${mediadleStats.totalPlayed} > 0 
                        THEN (CAST(${mediadleStats.totalWon} AS REAL) / ${mediadleStats.totalPlayed}) * 100
                        ELSE 0
                    END
                `,
            })
            .from(mediadleStats)
            .where(eq(mediadleStats.userId, userId))
            .get();
    }

    static async createMediadleStats(userId: number, mediaType: MediaType) {
        const [newStats] = await db
            .insert(mediadleStats)
            .values({
                userId,
                mediaType,
                streak: 0,
                totalWon: 0,
                bestStreak: 0,
                totalPlayed: 0,
                averageAttempts: 0,
            })
            .returning({
                id: mediadleStats.id,
                totalWon: mediadleStats.totalWon,
                currentStreak: mediadleStats.streak,
                bestStreak: mediadleStats.bestStreak,
                totalPlayed: mediadleStats.totalPlayed,
                averageAttempts: mediadleStats.averageAttempts,
                winRate: sql<number>`
                    CASE 
                        WHEN ${mediadleStats.totalPlayed} > 0 
                        THEN (CAST(${mediadleStats.totalWon} AS REAL) / ${mediadleStats.totalPlayed}) * 100
                        ELSE 0
                    END
                `,
            });

        return newStats!;
    }

    static async updateMediadleStats(
        statsId: number,
        totalPlayed: number,
        totalWon: number,
        streak: number,
        bestStreak: number,
        averageAttempts: number
    ) {
        const [updatedStats] = await db
            .update(mediadleStats)
            .set({
                totalPlayed,
                totalWon,
                streak,
                bestStreak,
                averageAttempts,
            })
            .where(eq(mediadleStats.id, statsId))
            .returning();

        return updatedStats!;
    }

    static async getUserAttemptsData(userId: number) {
        return db
            .select({
                attempts: userMediadleProgress.attempts,
                completionTime: sql<string>`strftime('%d-%m-%Y', ${userMediadleProgress.completionTime})`,
            })
            .from(userMediadleProgress)
            .where(and(eq(userMediadleProgress.userId, userId), isNotNull(userMediadleProgress.completionTime)))
            .orderBy(userMediadleProgress.completionTime)
            .execute();
    }
}
