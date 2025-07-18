import {db} from "@/lib/server/database/db";
import {JobType, Status} from "@/lib/server/utils/enums";
import {getDbClient} from "@/lib/server/database/async-storage";
import {Achievement} from "@/lib/server/types/achievements.types";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";
import {AddedMediaDetails, ConfigTopMetric} from "@/lib/server/types/base.types";
import {Movie, UpsertMovieWithDetails} from "@/lib/server/domain/media/movies/movies.types";
import {MovieSchemaConfig, moviesConfig} from "@/lib/server/domain/media/movies/movies.config";
import {movies, moviesActors, moviesGenre, moviesList} from "@/lib/server/database/schema";
import {and, asc, count, countDistinct, eq, getTableColumns, gte, isNotNull, like, lte, max, ne, or, sql} from "drizzle-orm";


export class MoviesRepository extends BaseRepository<MovieSchemaConfig> {
    config: MovieSchemaConfig;

    constructor() {
        super(moviesConfig);
        this.config = moviesConfig;
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

        return avgDuration?.average ? avgDuration.average : 0;
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
            metricNameCol: movies.originalLanguage,
            metricIdCol: movies.id,
            mediaLinkCol: moviesList.mediaId,
            filters: [ne(moviesList.status, Status.PLAN_TO_WATCH)],
        };
        const directorsConfig: ConfigTopMetric = {
            metricTable: movies,
            metricNameCol: movies.directorName,
            metricIdCol: movies.id,
            mediaLinkCol: moviesList.mediaId,
            filters: [ne(moviesList.status, Status.PLAN_TO_WATCH)],
        };
        const actorsConfig: ConfigTopMetric = {
            metricTable: moviesActors,
            metricNameCol: moviesActors.name,
            metricIdCol: moviesActors.mediaId,
            mediaLinkCol: moviesList.mediaId,
            filters: [ne(moviesList.status, Status.PLAN_TO_WATCH)],
        };

        const langsStats = await this.computeTopMetricStats(langsConfig, userId);
        const actorsStats = await this.computeTopMetricStats(actorsConfig, userId);
        const directorsStats = await this.computeTopMetricStats(directorsConfig, userId);

        return { directorsStats, actorsStats, langsStats };
    }

    // --- Implemented Methods ------------------------------------------------

    async computeAllUsersStats() {
        const timeSpentStat = sql<number>`
            COALESCE(SUM(
                CASE 
                    WHEN ${moviesList.status} = ${Status.COMPLETED} THEN (1 + ${moviesList.redo}) * ${movies.duration}
                    ELSE 0
                END
            ), 0)
        `
        const totalSpecificStat = sql<number>`
            COALESCE(SUM(
                CASE 
                    WHEN ${moviesList.status} = ${Status.COMPLETED} THEN 1 + ${moviesList.redo}
                    ELSE 0
                END
            ), 0)
        `

        return this._computeAllUsersStats(timeSpentStat, totalSpecificStat)
    }

    async addMediaToUserList(userId: number, media: Movie, newStatus: Status) {
        const newTotal = (newStatus === Status.COMPLETED) ? 1 : 0;

        const [newMedia] = await getDbClient()
            .insert(moviesList)
            .values({ userId, mediaId: media.id, total: newTotal, status: newStatus })
            .returning();

        return newMedia;
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
            .leftJoin(moviesActors, eq(moviesActors.mediaId, movies.id))
            .leftJoin(moviesGenre, eq(moviesGenre.mediaId, movies.id))
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
        const tx = getDbClient();

        const [media] = await tx
            .insert(movies)
            .values({
                ...mediaData,
                lastApiUpdate: sql`datetime('now')`,
            })
            .returning()

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
            throw new Error("JobType not supported");
        }
    }
}
