import {db} from "@/lib/server/database/db";
import {and, asc, count, desc, eq, inArray, ne, sql} from "drizzle-orm";
import {BaseRepository} from "@/lib/server/repositories/media/base.repository";
import {followers, movies, moviesActors, moviesGenre, moviesLabels, moviesList, user} from "@/lib/server/database/schema";


export class MoviesRepository extends BaseRepository<typeof movies, typeof moviesList> {
    private MAX_SIMILAR_GENRES = 12;

    constructor() {
        super(movies, moviesList);
    }

    async findByApiId(apiId: number) {
        return await db.query.movies.findFirst({ where: (movies, { eq }) => eq(movies.apiId, apiId) });
    }

    async findById(id: number) {
        return await db.query.movies.findFirst({ where: (movies, { eq }) => eq(movies.id, id) });
    }

    async findAllAssociatedDetails(mediaId: number) {
        const mainMovieData = await db.query.movies.findFirst({
            where: eq(movies.id, mediaId),
            with: { moviesActors: true, moviesGenres: true },
        });

        if (!mainMovieData) {
            throw new Error("Movie not found");
        }

        const collectionMovies = mainMovieData?.collectionId
            ? await db.query.movies.findMany({
                where: and(eq(movies.collectionId, mainMovieData.collectionId), ne(movies.id, mediaId)),
                columns: { id: true, name: true, imageCover: true },
                orderBy: [asc(movies.releaseDate)],
            }) : [];

        return { ...mainMovieData, collection: collectionMovies };
    }

    async findUserMedia(userId: number, mediaId: number) {
        const mainUserMediaData = await db.query.moviesList.findFirst({
            where: and(eq(moviesList.userId, userId), eq(moviesList.mediaId, mediaId)),
        });

        if (!mainUserMediaData) return null;

        const associatedLabels = await db.query.moviesLabels.findMany({
            where: and(eq(moviesLabels.mediaId, mediaId), eq(moviesLabels.userId, userId)),
            columns: { id: true, name: true },
            orderBy: [asc(moviesLabels.name)],
        });

        return { ...mainUserMediaData, labels: associatedLabels };
    }

    async getUserFollowsMediaData(userId: number, mediaId: number) {
        const inFollowsLists = await db
            .select({
                id: user.id,
                name: user.name,
                image: user.image,
                mediaList: moviesList,
            })
            .from(followers)
            .innerJoin(user, eq(user.id, followers.followedId))
            .innerJoin(moviesList, eq(moviesList.userId, followers.followedId))
            .where(and(eq(followers.followerId, userId), eq(moviesList.mediaId, mediaId)));

        return inFollowsLists;
    }

    async findSimilarMedia(mediaId: number) {
        const targetGenresSubQuery = db
            .select({ name: moviesGenre.name })
            .from(moviesGenre)
            .where(eq(moviesGenre.mediaId, mediaId));

        const similarMoviesSubQuery = db
            .select({ movieId: moviesGenre.mediaId, commonGenreCount: count(moviesGenre.name).as('common_genre_count') })
            .from(moviesGenre)
            .where(and(ne(moviesGenre.mediaId, mediaId), inArray(moviesGenre.name, targetGenresSubQuery)))
            .groupBy(moviesGenre.mediaId)
            .orderBy(desc(sql`common_genre_count`))
            .limit(this.MAX_SIMILAR_GENRES)
            .as("similar_movies");

        const results = await db
            .select({
                mediaId: movies.id,
                mediaName: movies.name,
                mediaCover: movies.imageCover,
                commonGenreCount: similarMoviesSubQuery.commonGenreCount,
            })
            .from(similarMoviesSubQuery)
            .innerJoin(movies, eq(movies.id, similarMoviesSubQuery.movieId))
            .orderBy(desc(similarMoviesSubQuery.commonGenreCount));

        return results;
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
}
