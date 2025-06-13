import {db} from "@/lib/server/database/db";
import {JobType, Status} from "@/lib/server/utils/enums";
import {getDbClient} from "@/lib/server/database/asyncStorage";
import {MediaListArgs} from "@/lib/server/types/media-lists.types";
import {movies, moviesActors, moviesGenre, moviesList} from "@/lib/server/database/schema";
import {MovieSchemaConfig, moviesConfig} from "@/lib/server/domain/media/movies/movies.config";
import {applyJoin, BaseRepository, isValidFilter} from "@/lib/server/domain/media/base/base.repository";
import {and, asc, count, countDistinct, eq, getTableColumns, gte, inArray, isNotNull, isNull, like, lte, ne, notInArray, or, sql} from "drizzle-orm";


export class MoviesRepository extends BaseRepository<MovieSchemaConfig> {
    config: MovieSchemaConfig;

    constructor() {
        super(moviesConfig, createMoviesFilters);
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
            .where(and(
                eq(moviesList.userId, userId),
                notInArray(moviesList.status, [Status.DROPPED, Status.RANDOM]),
                gte(movies.releaseDate, sql`CURRENT_TIMESTAMP`),
            ))
            .orderBy(asc(movies.releaseDate))
            .execute();

        return comingNext;
    }

    async downloadMediaListAsCSV(userId: number) {
        const results = await getDbClient()
            .select({
                ...getTableColumns(moviesList),
                name: movies.name,
            })
            .from(moviesList)
            .innerJoin(movies, eq(moviesList.mediaId, movies.id))
            .where(eq(moviesList.userId, userId))

        return results;
    }

    async getNonListMediaIds() {
        const mediaToDelete = await getDbClient()
            .select({ id: movies.id })
            .from(movies)
            .leftJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(isNull(moviesList.userId))
            .execute();

        return mediaToDelete.map((media) => media.id);
    }

    async removeMediaByIds(mediaIds: number[]) {
        await getDbClient()
            .delete(moviesActors)
            .where(inArray(moviesActors.mediaId, mediaIds))
            .execute();

        await getDbClient()
            .delete(moviesGenre)
            .where(inArray(moviesGenre.mediaId, mediaIds))
            .execute();

        await getDbClient()
            .delete(movies)
            .where(inArray(movies.id, mediaIds))
            .execute();
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

    async searchByName(query: string) {
        return getDbClient()
            .select({ name: movies.name })
            .from(movies)
            .where(like(movies.name, `%${query}%`))
            .orderBy(movies.name)
            .limit(20)
            .execute();
    }

    async computeAllUsersStats() {
        const results = await getDbClient()
            .select({
                userId: moviesList.userId,
                timeSpent: sql<number>`COALESCE(SUM(${moviesList.total} * ${movies.duration}), 0)`.as("timeSpent"),
                totalSpecific: sql<number>`COALESCE(SUM(${moviesList.total}), 0)`.as("totalSpecific"),
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
                ...getTableColumns(movies),
                mediaList: { ...getTableColumns(moviesList) },
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

    async addMediaToUserList(userId: number, mediaId: number, newStatus: Status) {
        const newTotal = (newStatus === Status.COMPLETED) ? 1 : 0;

        const [newMedia] = await getDbClient()
            .insert(moviesList)
            .values({ userId, mediaId, total: newTotal, status: newStatus })
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

    async getMediaToBeRefreshed() {
        return getDbClient()
            .select({ apiId: movies.apiId })
            .from(movies)
            .where(and(
                lte(movies.lastApiUpdate, sql`datetime(CURRENT_TIMESTAMP, '-2 days')`),
                or(
                    gte(movies.releaseDate, sql`CURRENT_TIMESTAMP`),
                    gte(movies.releaseDate, sql`datetime(CURRENT_TIMESTAMP, '-6 months')`),
                )));
    }

    async findAllAssociatedDetails(mediaId: number) {
        const mainData = await getDbClient().query.movies.findFirst({
            where: eq(movies.id, mediaId),
            with: {
                moviesActors: true,
                moviesGenres: true,
            },
        });

        if (!mainData) {
            throw new Error("Movie not found");
        }

        const collectionMovies = mainData?.collectionId
            ? await getDbClient().query.movies.findMany({
                where: and(eq(movies.collectionId, mainData.collectionId), ne(movies.id, mediaId)),
                columns: { id: true, name: true, imageCover: true },
                orderBy: [asc(movies.releaseDate)],
            }) : [];

        return { ...mainData, collection: collectionMovies };
    }

    async storeMediaWithDetails({ mediaData, actorsData, genresData }: any) {
        const result = await db.transaction(async (tx) => {
            const [media] = await tx
                .insert(movies)
                .values(mediaData)
                .returning()

            if (!media) {
                throw new Error("Failed to store the media details");
            }

            const mediaId = media.id;

            if (actorsData && actorsData.length > 0) {
                const actorsToAdd = actorsData.map((actor: any) => ({ mediaId, name: actor.name }));
                await tx.insert(moviesActors).values(actorsToAdd)
            }

            if (genresData && genresData.length > 0) {
                const genresToAdd = genresData.map((genre: any) => ({ mediaId, name: genre.name }));
                await tx.insert(moviesGenre).values(genresToAdd)
            }

            return mediaId;
        });

        return result
    }

    async updateMediaWithDetails({ mediaData, actorsData, genresData }: any) {
        const tx = getDbClient();

        const [media] = await tx
            .update(movies)
            .set({ ...mediaData, lastApiUpdate: sql`CURRENT_TIMESTAMP` })
            .where(eq(movies.apiId, mediaData.apiId))
            .returning({ id: movies.id })

        const mediaId = media.id;

        if (actorsData && actorsData.length > 0) {
            await tx.delete(moviesActors).where(eq(moviesActors.mediaId, mediaId));
            const actorsToAdd = actorsData.map((actor: any) => ({ mediaId, name: actor.name }));
            await tx.insert(moviesActors).values(actorsToAdd)
        }

        if (genresData && genresData.length > 0) {
            await tx.delete(moviesGenre).where(eq(moviesGenre.mediaId, mediaId));
            const genresToAdd = genresData.map((genre: any) => ({ mediaId, name: genre.name }));
            await tx.insert(moviesGenre).values(genresToAdd)
        }

        return true;
    }

    async getListFilters(userId: number) {
        const { genres, labels } = await super.getCommonListFilters(userId);

        const langs = await getDbClient()
            .selectDistinct({ name: movies.originalLanguage })
            .from(movies)
            .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(eq(moviesList.userId, userId));

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

    async updateUserMediaDetails(userId: number, mediaId: number, updateData: Record<string, any>) {
        const [result] = await getDbClient()
            .update(moviesList)
            .set(updateData)
            .where(and(eq(moviesList.userId, userId), eq(moviesList.mediaId, mediaId)))
            .returning();

        return result;
    }

    async calculateSpecificStats(userId: number) {
        const ratings = await this.computeRatingStats(userId);
        const totalLabels = await this.getTotalMediaLabel(userId);
        const genresStats = await this.computeGenresStats(userId);
        const releaseDates = await this.computeReleaseDateStats(userId);

        const directorsConfig = {
            metricTable: movies,
            metricNameColumn: movies.directorName,
            metricIdColumn: movies.id,
            mediaLinkColumn: moviesList.mediaId,
            statusFilters: [Status.PLAN_TO_WATCH],
        };
        const actorsConfig = {
            metricTable: moviesActors,
            metricNameColumn: moviesActors.name,
            metricIdColumn: moviesActors.mediaId,
            mediaLinkColumn: moviesList.mediaId,
            statusFilters: [Status.PLAN_TO_WATCH],
        };
        const languagesConfig = {
            metricTable: movies,
            metricNameColumn: movies.originalLanguage,
            metricIdColumn: movies.id,
            mediaLinkColumn: moviesList.mediaId,
            statusFilters: [Status.PLAN_TO_WATCH],
        };
        const languagesStats = await this.topMetricStatsQueries(userId, languagesConfig);
        const directorsStats = await this.topMetricStatsQueries(userId, directorsConfig);
        const actorsStats = await this.topMetricStatsQueries(userId, actorsConfig);

        const [{ totalBudget, totalRevenue }] = await db
            .select({
                totalBudget: sql<number>`coalesce(sum(${movies.budget}), 0)::numeric`.as("total_budget"),
                totalRevenue: sql<number>`coalesce(sum(${movies.revenue}), 0)::numeric`.as("total_revenue"),
            })
            .from(movies)
            .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(and(eq(moviesList.userId, userId), ne(moviesList.status, Status.PLAN_TO_WATCH)));

        const durationDistribution = await db
            .select({
                name: sql<number>`floor(${movies.duration} / 30.0) * 30`,
                value: sql<number>`cast(count(${movies.id}) as int)`.as("count"),
            })
            .from(movies)
            .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(and(eq(moviesList.userId, userId), ne(moviesList.status, Status.PLAN_TO_WATCH), isNotNull(movies.duration)))
            .groupBy(sql<number>`floor(${movies.duration} / 30.0) * 30`)
            .orderBy(asc(sql<number>`floor(${movies.duration} / 30.0) * 30`));

        const [avgDuration] = await db
            .select({ average: sql<number | null>`cast(avg(${movies.duration}) as numeric)`.as("avg_duration") })
            .from(movies)
            .innerJoin(moviesList, eq(moviesList.mediaId, movies.id))
            .where(and(eq(moviesList.userId, userId), ne(moviesList.status, Status.PLAN_TO_WATCH), isNotNull(movies.duration)));

        return {
            ratings,
            totalLabels,
            releaseDates,
            genresStats,
            directorsStats,
            languagesStats,
            actorsStats,
            totalBudget,
            totalRevenue,
            avgDuration: avgDuration?.average,
            durationDistribution,
        };
    }
}


const createMoviesFilters = (config: MovieSchemaConfig) => {
    const { mediaTable, actorConfig } = config;

    return {
        directors: {
            isActive: (args: MediaListArgs) => isValidFilter(args.directors),
            getCondition: (args: MediaListArgs) => inArray(mediaTable.directorName, args.directors!),
        },
        languages: {
            isActive: (args: MediaListArgs) => isValidFilter(args.langs),
            getCondition: (args: MediaListArgs) => inArray(mediaTable.originalLanguage, args.langs!),
        },
        actors: {
            isActive: (args: MediaListArgs) => isValidFilter(args.actors),
            applyJoin: (qb: any, _args: MediaListArgs) => applyJoin(qb, actorConfig),
            getCondition: (args: MediaListArgs) => inArray(actorConfig.filterColumnInEntity, args.actors!),
        },
    }
}
