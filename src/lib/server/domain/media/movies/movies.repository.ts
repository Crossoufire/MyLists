import {db} from "@/lib/server/database/db";
import {JobType, Status} from "@/lib/server/utils/enums";
import {getDbClient} from "@/lib/server/database/asyncStorage";
import {moviesConfig} from "@/lib/server/domain/media/movies/movies.config";
import {MediaListArgs, MovieSchemaConfig} from "@/lib/server/types/media-lists.types";
import {movies, moviesActors, moviesGenre, moviesList} from "@/lib/server/database/schema";
import {and, asc, eq, gte, inArray, isNotNull, like, ne, notInArray, sql} from "drizzle-orm";
import {applyJoin, BaseRepository, isValidFilter} from "@/lib/server/domain/media/base/base.repository";


export class MoviesRepository extends BaseRepository<MovieSchemaConfig> {
    config: MovieSchemaConfig;

    constructor() {
        super(moviesConfig, createMoviesFilters);
        this.config = moviesConfig;
    }

    async getComingNext(userId: number) {
        const comingNext = await db
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
                gte(movies.releaseDate, sql`datetime('now')`),
            ))
            .groupBy(movies.originalLanguage)
            .orderBy(asc(movies.releaseDate))
            .execute();

        return comingNext;
    }

    async searchByName(query: string) {
        return db
            .select({ name: movies.name })
            .from(movies)
            .where(like(movies.name, `%${query}%`))
            .orderBy(movies.name)
            .limit(20)
            .execute();
    }

    async addMediaToUserList(userId: number, mediaId: number, newStatus: Status) {
        const newTotal = newStatus === Status.COMPLETED ? 1 : 0;

        const [newMedia] = await getDbClient()
            .insert(moviesList)
            .values({ userId, mediaId, total: newTotal, status: newStatus })
            .returning();

        return newMedia;
    }

    async findAllAssociatedDetails(mediaId: number) {
        const mainData = await db.query.movies.findFirst({
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
            ? await db.query.movies.findMany({
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

    async getListFilters(userId: number) {
        const { genres, labels } = await super.getCommonListFilters(userId);

        const langs = await db
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
        const releaseDates = await this.computeReleaseDateStats(userId);
        const genresStats = await this.computeGenresStats(userId);

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
