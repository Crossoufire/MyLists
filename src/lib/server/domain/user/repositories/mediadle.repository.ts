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

    static async getUserMediadleStats(userId: number) {
        return db
            .select({
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
