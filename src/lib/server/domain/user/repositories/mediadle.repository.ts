import {MediaType} from "@/lib/server/utils/enums";
import {getDbClient} from "@/lib/server/database/asyncStorage";
import {and, count, desc, eq, getTableColumns, gte, isNotNull, like, notInArray, sql} from "drizzle-orm";
import {dailyMediadle, mediadleStats, movies, user, userMediadleProgress} from "@/lib/server/database/schema";
import {db} from "@/lib/server/database/db";


export class MediadleRepository {
    static async getAdminAllUsersStats(data: Record<string, any>) {
        const page = data.pageIndex ?? 0;
        const search = data.search ?? "";
        const perPage = data.pageSize ?? 25;
        const offset = page * perPage;

        const totalResult = await db
            .select({ count: count() })
            .from(mediadleStats)
            .innerJoin(user, eq(mediadleStats.userId, user.id))
            .where(like(user.name, `%${search}%`))
            .execute();
        const totalStats = totalResult[0]?.count ?? 0;

        const results = await db
            .select({
                name: user.name,
                email: user.email,
                image: user.image,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                ...getTableColumns(mediadleStats),
            })
            .from(mediadleStats)
            .innerJoin(user, eq(mediadleStats.userId, user.id))
            .where(like(user.name, `%${search}%`))
            .orderBy(desc(mediadleStats.totalPlayed))
            .limit(perPage)
            .offset(offset)
            .execute();

        return { items: results, pages: Math.ceil((totalStats ?? 0) / perPage), total: totalStats };
    }

    static async getTodayMoviedle() {
        const today = new Date().toISOString().slice(0, 10);
        return getDbClient().select().from(dailyMediadle).where(sql`${dailyMediadle.date} >= ${today}`).get();
    }

    static async createDailyMoviedle() {
        const alreadyUsedMovies = await getDbClient()
            .select({ mediaId: dailyMediadle.mediaId })
            .from(dailyMediadle)
            .where(eq(dailyMediadle.mediaType, MediaType.MOVIES))
            .limit(200)
            .execute();
        const alreadyUsedMoviesIds = alreadyUsedMovies.map((row: any) => row.mediaId);

        const selectedMovie = await getDbClient()
            .select()
            .from(movies)
            .where(and(notInArray(movies.id, alreadyUsedMoviesIds), gte(movies.voteCount, 700)))
            .orderBy(sql`RANDOM()`)
            .get();

        if (!selectedMovie) {
            throw new Error("No new movies found to create a daily mediadle.");
        }

        const [newMoviedle] = await getDbClient()
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
        return getDbClient()
            .select()
            .from(userMediadleProgress)
            .where(and(eq(userMediadleProgress.userId, userId), eq(userMediadleProgress.dailyMediadleId, mediadleId)))
            .get();
    }

    static async createUserProgress(userId: number, mediadleId: number) {
        const [newUserProgress] = await getDbClient()
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
        const [updatedProgress] = await getDbClient()
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
        return getDbClient()
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
        const [newStats] = await getDbClient()
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

    static async updateMediadleStats(statsId: number, isCompleted: boolean, isCorrect: boolean, attempts: number) {
        const [updatedStats] = await getDbClient()
            .update(mediadleStats)
            .set({
                totalPlayed: sql`CASE 
                    WHEN ${isCompleted} THEN ${mediadleStats.totalPlayed} + 1 
                    ELSE ${mediadleStats.totalPlayed} 
                END`,
                totalWon: sql`CASE 
                    WHEN ${isCorrect} THEN ${mediadleStats.totalWon} + 1 
                    ELSE ${mediadleStats.totalWon} 
                END`,
                streak: sql`CASE 
                    WHEN ${isCompleted} THEN
                        CASE 
                            WHEN ${isCorrect} THEN ${mediadleStats.streak} + 1
                            ELSE 0
                        END
                    ELSE ${mediadleStats.streak}
                END`,
                bestStreak: sql`CASE 
                    WHEN ${isCompleted} AND ${isCorrect} AND ${mediadleStats.streak} + 1 > ${mediadleStats.bestStreak} 
                    THEN ${mediadleStats.streak} + 1
                    ELSE 
                        CASE
                            WHEN ${mediadleStats.bestStreak} > ${mediadleStats.streak} THEN ${mediadleStats.bestStreak}
                            ELSE ${mediadleStats.streak}
                        END
                END`,
                averageAttempts: sql`CASE 
                    WHEN ${isCompleted} THEN
                        CASE 
                            WHEN ${mediadleStats.totalPlayed} = 0 THEN ${attempts}
                            ELSE ((${mediadleStats.averageAttempts} * ${mediadleStats.totalPlayed} + ${attempts}) / (${mediadleStats.totalPlayed} + 1))
                        END
                    ELSE ${mediadleStats.averageAttempts}
                END`,
            })
            .where(eq(mediadleStats.id, statsId))
            .returning();

        return updatedStats!;
    }

    static async getUserAttempts(userId: number) {
        return getDbClient()
            .select({
                attempts: userMediadleProgress.attempts,
                completionTime: sql<string>`strftime('%d-%m-%Y', ${userMediadleProgress.completionTime})`,
            })
            .from(userMediadleProgress)
            .where(and(eq(userMediadleProgress.userId, userId), isNotNull(userMediadleProgress.completionTime)))
            .orderBy(userMediadleProgress.completionTime)
            .execute();
    }

    static async incrementUserAttempts(userId: number, mediadleId: number, isCompleted: boolean, isSucceeded: boolean) {
        const [updatedProgress] = await getDbClient()
            .update(userMediadleProgress)
            .set({
                completed: isCompleted,
                succeeded: isSucceeded,
                attempts: sql`${userMediadleProgress.attempts} + 1`,
                completionTime: isCompleted ? sql`CURRENT_TIMESTAMP` : undefined,
            })
            .where(and(
                eq(userMediadleProgress.userId, userId),
                eq(userMediadleProgress.dailyMediadleId, mediadleId),
                eq(userMediadleProgress.completed, false), // Only update if not already completed
            ))
            .returning();

        return updatedProgress!;
    }
}
