import {db} from "@/lib/server/database/db";
import {JobType, Status} from "@/lib/server/utils/enums";
import {getDbClient} from "@/lib/server/database/async-storage";
import {Achievement} from "@/lib/server/types/achievements.types";
import {IMoviesRepository} from "@/lib/server/types/repositories.types";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";
import {AddedMediaDetails, ConfigTopMetric} from "@/lib/server/types/base.types";
import {movies, moviesActors, moviesGenre, moviesList} from "@/lib/server/database/schema";
import {MovieSchemaConfig, moviesConfig} from "@/lib/server/domain/media/movies/movies.config";
import {Movie, MoviesList, UpsertMovieWithDetails} from "@/lib/server/domain/media/movies/movies.types";
import {and, asc, count, countDistinct, eq, getTableColumns, gte, isNotNull, like, lte, max, ne, or, sql} from "drizzle-orm";


export class MoviesRepository extends BaseRepository<Movie, MoviesList, MovieSchemaConfig> implements IMoviesRepository {
    config: MovieSchemaConfig;

    constructor() {
        super(moviesConfig);
        this.config = moviesConfig;
    }

    async getComingNext(userId: number) {
        const comingNext = await getDbClient()
            .select({
                mediaId: movies.id,
                mediaName: movies.name,
                date: movies.releaseDate,
                imageCover: movies.imageCover,
            })
            .from(movies)
            .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(and(eq(moviesList.userId, userId), gte(movies.releaseDate, sql`datetime('now')`)))
            .orderBy(asc(movies.releaseDate))
            .execute();

        return comingNext;
    }

    async lockOldMovies() {
        const [{ count }] = await getDbClient()
            .select({ count: sql<number>`count(*)` })
            .from(movies)
            .where(and(eq(movies.lockStatus, false), lte(movies.releaseDate, sql`datetime('now', '-6 months')`)))
            .execute();

        await getDbClient()
            .update(movies)
            .set({ lockStatus: true })
            .where(and(eq(movies.lockStatus, false), lte(movies.releaseDate, sql`datetime('now', '-6 months')`)))
            .execute();

        return count;
    }

    async computeAllUsersStats() {
        const results = await getDbClient()
            .select({
                userId: moviesList.userId,
                timeSpent: sql<number>`
                    COALESCE(SUM(
                        CASE 
                            WHEN ${moviesList.status} = ${Status.COMPLETED} THEN (1 + ${moviesList.redo}) * ${movies.duration}
                            ELSE 0
                        END
                    ), 0)
                `.as("timeSpent"),
                totalSpecific: sql<number>`
                    COALESCE(SUM(
                        CASE 
                            WHEN ${moviesList.status} = ${Status.COMPLETED} THEN 1 + ${moviesList.redo}
                            ELSE 0
                        END
                    ), 0)
                `.as("totalSpecific"),
                statusCounts: sql`
                    COALESCE((
                        SELECT 
                            JSON_GROUP_OBJECT(status, count_per_status) 
                        FROM (
                            SELECT 
                                status,
                                COUNT(*) as count_per_status 
                            FROM ${moviesList} as sub_list 
                            WHERE sub_list.user_id = ${moviesList.userId} GROUP BY status
                        )
                    ), '{}')
                `.as("statusCounts"),
                entriesFavorites: sql<number>`
                    COALESCE(SUM(CASE WHEN ${moviesList.favorite} = 1 THEN 1 ELSE 0 END), 0)
                `.as("entriesFavorites"),
                totalRedo: sql<number>`COALESCE(SUM(${moviesList.redo}), 0)`.as("totalRedo"),
                entriesCommented: sql<number>`
                    COALESCE(SUM(CASE WHEN LENGTH(TRIM(COALESCE(${moviesList.comment}, ''))) > 0 THEN 1 ELSE 0 END), 0)
                `.as("entriesCommented"),
                totalEntries: count(moviesList.mediaId).as("totalEntries"),
                entriesRated: count(moviesList.rating).as("entriesRated"),
                sumEntriesRated: sql<number>`COALESCE(SUM(${moviesList.rating}), 0)`.as("sumEntriesRated"),
                averageRating: sql<number>`
                    COALESCE(SUM(${moviesList.rating}) * 1.0 / NULLIF(COUNT(${moviesList.rating}), 0), 0.0)
                `.as("averageRating"),
            })
            .from(moviesList)
            .innerJoin(movies, eq(moviesList.mediaId, movies.id))
            .groupBy(moviesList.userId)
            .execute();

        return results.map((row) => {
            let statusCounts: Record<string, number> = {};
            try {
                const parsed = typeof row.statusCounts === "string" ? JSON.parse(row.statusCounts) : row.statusCounts;
                if (typeof parsed === "object" && parsed !== null) {
                    statusCounts = parsed;
                }
            }
            catch (e) {
                console.error(`Failed to parse statusCounts for user ${row.userId}:`, row.statusCounts, e);
            }

            return {
                userId: row.userId,
                statusCounts: statusCounts,
                timeSpent: Number(row.timeSpent) || 0,
                totalRedo: Number(row.totalRedo) || 0,
                totalEntries: Number(row.totalEntries) || 0,
                entriesRated: Number(row.entriesRated) || 0,
                totalSpecific: Number(row.totalSpecific) || 0,
                averageRating: Number(row.averageRating) || 0,
                sumEntriesRated: Number(row.sumEntriesRated) || 0,
                entriesFavorites: Number(row.entriesFavorites) || 0,
                entriesCommented: Number(row.entriesCommented) || 0,
            };
        });
    }

    async getMediaToNotify() {
        return getDbClient()
            .select({
                mediaId: movies.id,
                mediaName: movies.name,
                releaseDate: movies.releaseDate,
                userId: moviesList.userId,
            })
            .from(movies)
            .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(and(
                isNotNull(movies.releaseDate),
                gte(movies.releaseDate, sql`datetime('now')`),
                lte(movies.releaseDate, sql`datetime('now', '+7 days')`),
            ))
            .orderBy(movies.releaseDate)
            .execute();
    }

    async addMediaToUserList(userId: number, media: Movie, newStatus: Status) {
        const newTotal = (newStatus === Status.COMPLETED) ? 1 : 0;

        const [newMedia] = await getDbClient()
            .insert(moviesList)
            .values({ userId, mediaId: media.id, total: newTotal, status: newStatus })
            .returning();

        return newMedia;
    }

    async getMediaJobDetails(userId: number, job: JobType, name: string, offset: number, limit = 25) {
        let dataQuery = getDbClient()
            .selectDistinct({
                mediaId: movies.id,
                mediaName: movies.name,
                imageCover: movies.imageCover,
                inUserList: isNotNull(moviesList.userId).mapWith(Boolean).as("inUserList"),
            })
            .from(movies)
            .leftJoin(moviesList, and(eq(moviesList.mediaId, movies.id), eq(moviesList.userId, userId)))
            .$dynamic();

        let countQuery = getDbClient()
            .select({ value: countDistinct(movies.id) })
            .from(movies)
            .$dynamic();

        let filterCondition;
        if (job === JobType.ACTOR) {
            dataQuery = dataQuery.innerJoin(moviesActors, eq(moviesActors.mediaId, movies.id));
            countQuery = countQuery.innerJoin(moviesActors, eq(moviesActors.mediaId, movies.id));
            filterCondition = like(moviesActors.name, `%${name}%`);
        }
        else if (job === JobType.CREATOR) {
            filterCondition = like(movies.directorName, `%${name}%`);
        }
        else if (job === JobType.COMPOSITOR) {
            filterCondition = like(movies.compositorName, `%${name}%`);
        }
        else {
            throw new Error("Job type not supported");
        }

        if (filterCondition) {
            dataQuery = dataQuery.where(filterCondition);
            countQuery = countQuery.where(filterCondition);
        }

        const [totalResult, results] = await Promise.all([
            countQuery.execute(),
            dataQuery.orderBy(asc(movies.releaseDate)).limit(limit).offset(offset).execute(),
        ]);

        const totalCount = totalResult[0]?.value ?? 0;

        return {
            items: results,
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
        };
    }

    async getMediaIdsToBeRefreshed() {
        const results = await getDbClient()
            .select({ apiId: movies.apiId })
            .from(movies)
            .where(and(
                lte(movies.lastApiUpdate, sql`datetime('now', '-2 days')`),
                or(
                    gte(movies.releaseDate, sql`datetime('now')`),
                    gte(movies.releaseDate, sql`datetime('now', '-6 months')`),
                )));

        return results.map((r) => r.apiId);
    }

    async findAllAssociatedDetails(mediaId: number) {
        const details = await getDbClient()
            .select({
                ...getTableColumns(movies),
                actors: sql`json_group_array(DISTINCT json_object('id', ${moviesActors.id}, 'name', ${moviesActors.name}))`.mapWith(JSON.parse),
                genres: sql`json_group_array(DISTINCT json_object('id', ${moviesGenre.id}, 'name', ${moviesGenre.name}))`.mapWith(JSON.parse),
                collection: sql`
                    CASE 
                        WHEN ${movies.collectionId} IS NULL 
                        THEN json_array()
                        ELSE (
                            SELECT COALESCE(json_group_array(json_object(
                                'mediaId', m2.id, 
                                'mediaName', m2.name, 
                                'mediaCover', m2.image_cover
                            )), json_array())
                            FROM movies m2
                            WHERE m2.collection_id = ${movies.collectionId} 
                            AND m2.id != ${movies.id}
                        )
                    END
                `.mapWith(JSON.parse),
            }).from(movies)
            .innerJoin(moviesActors, eq(moviesActors.mediaId, movies.id))
            .innerJoin(moviesGenre, eq(moviesGenre.mediaId, movies.id))
            .where(eq(movies.id, mediaId))
            .groupBy(...Object.values(getTableColumns(movies)))
            .get();

        if (!details) return;

        const result: Movie & AddedMediaDetails = {
            ...details,
            actors: details.actors || [],
            genres: details.genres || [],
            collection: details.collection || [],
        };

        return result;
    }

    async storeMediaWithDetails({ mediaData, actorsData, genresData }: UpsertMovieWithDetails) {
        const result = await db.transaction(async (tx) => {
            const [media] = await tx
                .insert(movies)
                .values(mediaData)
                .returning()

            if (!media) return;
            const mediaId = media.id;

            if (actorsData && actorsData.length > 0) {
                const actorsToAdd = actorsData.map((a) => ({ mediaId, name: a.name }));
                await tx.insert(moviesActors).values(actorsToAdd)
            }

            if (genresData && genresData.length > 0) {
                const genresToAdd = genresData.map((g) => ({ mediaId, name: g.name }));
                await tx.insert(moviesGenre).values(genresToAdd)
            }

            return mediaId;
        });

        return result;
    }

    async updateMediaWithDetails({ mediaData, actorsData, genresData }: UpsertMovieWithDetails) {
        const tx = getDbClient();

        const [media] = await tx
            .update(movies)
            .set({ ...mediaData, lastApiUpdate: sql`datetime('now')` })
            .where(eq(movies.apiId, mediaData.apiId))
            .returning({ id: movies.id })

        const mediaId = media.id;

        if (actorsData && actorsData.length > 0) {
            await tx.delete(moviesActors).where(eq(moviesActors.mediaId, mediaId));
            const actorsToAdd = actorsData.map((a) => ({ mediaId, name: a.name }));
            await tx.insert(moviesActors).values(actorsToAdd)
        }

        if (genresData && genresData.length > 0) {
            await tx.delete(moviesGenre).where(eq(moviesGenre.mediaId, mediaId));
            const genresToAdd = genresData.map((g) => ({ mediaId, name: g.name }));
            await tx.insert(moviesGenre).values(genresToAdd)
        }

        return true;
    }

    async getListFilters(userId: number) {
        const { genres, labels } = await super.getCommonListFilters(userId);

        const langs = await getDbClient()
            .selectDistinct({ name: sql<string>`${movies.originalLanguage}` })
            .from(movies)
            .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(and(eq(moviesList.userId, userId), isNotNull(movies.originalLanguage)));

        return { langs, genres, labels };
    }

    async getSearchListFilters(userId: number, query: string, job: JobType) {
        if (job === JobType.ACTOR) {
            const actors = await db
                .selectDistinct({ name: moviesActors.name })
                .from(moviesActors)
                .innerJoin(moviesList, eq(moviesList.mediaId, moviesActors.mediaId))
                .where(and(eq(moviesList.userId, userId), like(moviesActors.name, `%${query}%`)));
            return actors
        }
        else if (job === JobType.CREATOR) {
            const directors = await db
                .selectDistinct({ name: movies.directorName })
                .from(movies)
                .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
                .where(and(eq(moviesList.userId, userId), like(movies.directorName, `%${query}%`)));
            return directors
        }
        else if (job === JobType.COMPOSITOR) {
            const compositors = await db
                .selectDistinct({ name: movies.compositorName })
                .from(movies)
                .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
                .where(and(eq(moviesList.userId, userId), like(movies.compositorName, `%${query}%`)));
            return compositors
        }
        else {
            throw new Error("Job type not supported");
        }
    }

    // --- Achievements ----------------------------------------------------------

    getDurationAchievementCte(achievement: Achievement, userId?: number) {
        const value = parseInt(achievement.value!);
        const isLong = achievement.codeName.includes("long");
        const condition = isLong ? gte(movies.duration, value) : lte(movies.duration, value);

        let baseCTE = getDbClient()
            .select({
                userId: moviesList.userId,
                value: count(moviesList.mediaId).as("value"),
            }).from(moviesList)
            .innerJoin(movies, eq(moviesList.mediaId, movies.id))

        const conditions = [eq(moviesList.status, Status.COMPLETED), condition]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    getDirectorAchievementCte(_achievement: Achievement, userId?: number) {
        let subQ = getDbClient()
            .select({
                userId: moviesList.userId,
                count: count(moviesList.mediaId).as("count"),
            }).from(moviesList)
            .innerJoin(movies, eq(moviesList.mediaId, movies.id))
            .where(eq(moviesList.status, Status.COMPLETED))
            .groupBy(userId ? eq(moviesList.userId, userId) : moviesList.userId, movies.directorName)
            .as("sub");

        return getDbClient()
            .select({
                userId: subQ.userId,
                value: max(subQ.count).as("value"),
            }).from(subQ)
            .groupBy(subQ.userId)
            .as("calculation");
    }

    getActorAchievementCte(_achievement: Achievement, userId?: number) {
        let subQ = getDbClient()
            .select({
                userId: moviesList.userId,
                count: count(moviesList.mediaId).as("count"),
            }).from(moviesList)
            .innerJoin(moviesActors, eq(moviesList.mediaId, moviesActors.mediaId))
            .where(eq(moviesList.status, Status.COMPLETED))
            .groupBy(userId ? eq(moviesList.userId, userId) : moviesList.userId, moviesActors.name)
            .as("sub");

        return getDbClient()
            .select({
                userId: subQ.userId,
                value: max(subQ.count).as("value"),
            }).from(subQ)
            .groupBy(subQ.userId)
            .as("calculation");
    }

    getLanguageAchievementCte(_achievement: Achievement, userId?: number) {
        let baseCTE = getDbClient()
            .select({
                userId: moviesList.userId,
                value: countDistinct(movies.originalLanguage).as("value"),
            }).from(moviesList)
            .innerJoin(movies, eq(moviesList.mediaId, movies.id))

        const conditions = [eq(moviesList.status, Status.COMPLETED)]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    // --- Advanced Stats  --------------------------------------------------

    async avgMovieDuration(userId?: number) {
        const forUser = userId ? eq(moviesList.userId, userId) : undefined;

        const avgDuration = await getDbClient()
            .select({
                average: sql<number | null>`avg(${movies.duration})`
            })
            .from(movies)
            .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(and(forUser, ne(moviesList.status, Status.PLAN_TO_WATCH), isNotNull(movies.duration)))
            .get();

        return avgDuration?.average;
    }

    async movieDurationDistrib(userId?: number) {
        const forUser = userId ? eq(moviesList.userId, userId) : undefined;

        return getDbClient()
            .select({
                name: sql<number>`floor(${movies.duration} / 30.0) * 30`,
                value: sql<number>`cast(count(${movies.id}) as int)`.as("count"),
            })
            .from(movies)
            .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(and(forUser, ne(moviesList.status, Status.PLAN_TO_WATCH), isNotNull(movies.duration)))
            .groupBy(sql<number>`floor(${movies.duration} / 30.0) * 30`)
            .orderBy(asc(sql<number>`floor(${movies.duration} / 30.0) * 30`));
    }

    async budgetRevenueStats(userId?: number) {
        const forUser = userId ? eq(moviesList.userId, userId) : undefined;

        const data = await getDbClient()
            .select({
                totalBudget: sql<number>`coalesce(sum(${movies.budget}), 0)`.as("total_budget"),
                totalRevenue: sql<number>`coalesce(sum(${movies.revenue}), 0)`.as("total_revenue"),
            })
            .from(movies)
            .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(and(forUser, ne(moviesList.status, Status.PLAN_TO_WATCH)))
            .get();

        return { totalBudget: data?.totalBudget, totalRevenue: data?.totalRevenue };
    }

    async specificTopMetrics(userId?: number) {
        const langsConfig: ConfigTopMetric = {
            metricTable: movies,
            metricNameColumn: movies.originalLanguage,
            metricIdColumn: movies.id,
            mediaLinkColumn: moviesList.mediaId,
            filters: [ne(moviesList.status, Status.PLAN_TO_WATCH)],
        };
        const directorsConfig: ConfigTopMetric = {
            metricTable: movies,
            metricNameColumn: movies.directorName,
            metricIdColumn: movies.id,
            mediaLinkColumn: moviesList.mediaId,
            filters: [ne(moviesList.status, Status.PLAN_TO_WATCH)],
        };
        const actorsConfig: ConfigTopMetric = {
            metricTable: moviesActors,
            metricNameColumn: moviesActors.name,
            metricIdColumn: moviesActors.mediaId,
            mediaLinkColumn: moviesList.mediaId,
            filters: [ne(moviesList.status, Status.PLAN_TO_WATCH)],
        };

        const langsStats = await this.computeTopMetricStats(langsConfig, userId);
        const actorsStats = await this.computeTopMetricStats(actorsConfig, userId);
        const directorsStats = await this.computeTopMetricStats(directorsConfig, userId);

        return { directorsStats, actorsStats, langsStats };
    }
}
