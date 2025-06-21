import {Status} from "@/lib/server/utils/enums";
import * as schema from "@/lib/server/database/schema";
import {asc, desc, getTableColumns} from "drizzle-orm";
import {MediaSchemaConfig} from "@/lib/server/types/media-lists.types";
import {createListFilterDef} from "@/lib/server/domain/media/base/base.repository";


export type MovieSchemaConfig = MediaSchemaConfig<
    typeof schema.movies,
    typeof schema.moviesList,
    typeof schema.moviesGenre,
    typeof schema.moviesLabels
>;


export const moviesConfig: MovieSchemaConfig = {
    mediaTable: schema.movies,
    listTable: schema.moviesList,
    genreTable: schema.moviesGenre,
    labelTable: schema.moviesLabels,
    mediaList: {
        baseSelection: {
            mediaName: schema.movies.name,
            imageCover: schema.movies.imageCover,
            director: schema.movies.directorName,
            originalLanguage: schema.movies.originalLanguage,
            ...getTableColumns(schema.moviesList),
        },
        filterDefinitions: {
            actors: createListFilterDef({
                argName: "actors",
                mediaTable: schema.movies,
                entityTable: schema.moviesActors,
                filterColumn: schema.moviesActors.name,
            }),
        },
        defaultStatus: Status.COMPLETED,
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
    },
    apiProvider: {
        maxGenres: 5,
    },
    editableFields: [
        "originalName", "name", "directorName", "releaseDate", "duration", "synopsis",
        "budget", "revenue", "tagline", "originalLanguage", "lockStatus", "homepage",
    ] as const,
};
