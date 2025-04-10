import {db} from "@/lib/server/database/db";
import {JobType} from "@/lib/server/utils/enums";
import {MovieSchemaConfig} from "@/lib/server/types/media-lists.types";
import {moviesConfig} from "@/lib/server/domain/media/movies/movies.config";
import {and, asc, avg, countDistinct, eq, inArray, like, ne, sum} from "drizzle-orm";
import {movies, moviesActors, moviesGenre, moviesList} from "@/lib/server/database/schema";
import {applyJoin, BaseRepository, isValidFilter} from "@/lib/server/domain/media/base/base.repository";


export class MoviesRepository extends BaseRepository<MovieSchemaConfig> {
    constructor() {
        super(moviesConfig, createMoviesFilters);
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

            if (!media) throw new Error();

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

        return result;
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

    async updateUserMediaDetails(userId: number, mediaId: number, updateData: any) {
        const [result] = await db
            .update(moviesList)
            .set(updateData)
            .where(and(eq(moviesList.userId, userId), eq(moviesList.mediaId, mediaId)))
            .returning();
        return result;
    }

    async calculateDetailedStats(userId: number) {
        const baseQuery = db
            .select({
                duration: movies.duration,
                budget: movies.budget,
                revenue: movies.revenue,
                director: movies.directorName,
                compositor: movies.compositorName,
                language: movies.originalLanguage,
            })
            .from(moviesList)
            .innerJoin(movies, eq(moviesList.mediaId, movies.id))
            .where(eq(moviesList.userId, userId))
            .as("userMovies");

        const genreQuery = db
            .select({ name: moviesGenre.name })
            .from(moviesList)
            .innerJoin(moviesGenre, eq(moviesList.mediaId, moviesGenre.mediaId))
            .where(eq(moviesList.userId, userId))
            .as("userGenres");

        const actorQuery = db
            .select({ name: moviesActors.name })
            .from(moviesList)
            .innerJoin(moviesActors, eq(moviesList.mediaId, moviesActors.mediaId))
            .where(eq(moviesList.userId, userId))
            .as("userActors");

        const [baseAggregations, genreAggregations, actorAggregations] =
            await Promise.all([
                db.select({
                    totalBudget: sum(baseQuery.budget),
                    totalRevenue: sum(baseQuery.revenue),
                    totalDurationMinutes: sum(baseQuery.duration),
                    averageDurationMinutes: avg(baseQuery.duration),
                    distinctDirectorsCount: countDistinct(baseQuery.director),
                    distinctLanguagesCount: countDistinct(baseQuery.language),
                    distinctCompositorsCount: countDistinct(baseQuery.compositor),
                }).from(baseQuery),
                db.select({ distinctGenresCount: countDistinct(genreQuery.name) }).from(genreQuery),
                db.select({ distinctActorsCount: countDistinct(actorQuery.name) }).from(actorQuery),
            ]);

        return {
            totalDurationMinutes: baseAggregations[0]?.totalDurationMinutes ?? 0,
            averageDurationMinutes: baseAggregations[0]?.averageDurationMinutes ?? null,
            totalBudget: baseAggregations[0]?.totalBudget ?? 0,
            totalRevenue: baseAggregations[0]?.totalRevenue ?? 0,
            directorsCount: baseAggregations[0]?.distinctDirectorsCount ?? 0,
            compositorsCount: baseAggregations[0]?.distinctCompositorsCount ?? 0,
            languagesCount: baseAggregations[0]?.distinctLanguagesCount ?? 0,
            genresCount: genreAggregations[0]?.distinctGenresCount ?? 0,
            actorsCount: actorAggregations[0]?.distinctActorsCount ?? 0,
        };
    }
}


const createMoviesFilters = (config: MovieSchemaConfig) => {
    const { mediaTable, actorConfig } = config;

    return {
        directors: {
            isActive: (args: any) => isValidFilter(args.directors),
            getCondition: (args: any) => inArray(mediaTable.directorName, args.directors!),
        },
        languages: {
            isActive: (args: any) => isValidFilter(args.langs),
            getCondition: (args: any) => inArray(mediaTable.originalLanguage, args.langs!),
        },
        actors: {
            isActive: (args: any) => isValidFilter(args.actors),
            applyJoin: (qb: any, _args: any) => applyJoin(qb, actorConfig),
            getCondition: (args: any) => inArray(actorConfig.filterColumnInEntity, args.actors!),
        },
    }
}
