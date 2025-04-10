import {asc, desc} from "drizzle-orm";
import * as schema from "@/lib/server/database/schema";
import {MovieSchemaConfig} from "@/lib/server/types/media-lists.types";


export const moviesConfig: MovieSchemaConfig = {
    mediaTable: schema.movies,
    listTable: schema.moviesList,
    genreTable: schema.moviesGenre,
    labelTable: schema.moviesLabels,
    baseSelection: {
        userId: schema.moviesList.userId,
        imageCover: schema.movies.imageCover,
        mediaId: schema.moviesList.mediaId,
        status: schema.moviesList.status,
        rating: schema.moviesList.rating,
        favorite: schema.moviesList.favorite,
        comment: schema.moviesList.comment,
        redo: schema.moviesList.redo,
        mediaName: schema.movies.name,
        director: schema.movies.directorName,
        originalLanguage: schema.movies.originalLanguage,
    },
    genreConfig: {
        entityTable: schema.moviesGenre,
        filterColumnInEntity: schema.moviesGenre.name,
        mediaIdColumnInEntity: schema.moviesGenre.mediaId,
        idColumnInMedia: schema.movies.id,
    },
    actorConfig: {
        entityTable: schema.moviesActors,
        filterColumnInEntity: schema.moviesActors.name,
        mediaIdColumnInEntity: schema.moviesActors.mediaId,
        idColumnInMedia: schema.movies.id,
    },
    defaultSortName: "Title A-Z",
    availableSorts: {
        "Title A-Z": asc(schema.movies.name),
        "Title Z-A": desc(schema.movies.name),
        "Rating +": [desc(schema.moviesList.rating), asc(schema.movies.name)],
        "Rating -": [asc(schema.moviesList.rating), asc(schema.movies.name)],
        "TMDB Rating +": [desc(schema.movies.voteAverage), asc(schema.movies.name)],
        "TMDB Rating -": [asc(schema.movies.voteAverage), asc(schema.movies.name)],
        "Release Date +": [desc(schema.movies.releaseDate), asc(schema.movies.name)],
        "Release Date -": [asc(schema.movies.releaseDate), asc(schema.movies.name)],
        "Re-Watched": [desc(schema.moviesList.redo), asc(schema.movies.name)],
    },
};
