import * as schema from "@/lib/server/database/schema";
import {JobType, Status} from "@/lib/utils/enums";
import {createArrayFilterDef} from "../base/base.repository";
import {asc, desc, getTableColumns} from "drizzle-orm";
import {MediaSchemaConfig} from "@/lib/types/media.config.types";
import {moviesAchievements} from "@/lib/server/domain/media/movies/achievements.seed";


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
            ...getTableColumns(schema.moviesList),
        },
        filterDefinitions: {
            actors: createArrayFilterDef({
                argName: "actors",
                mediaTable: schema.movies,
                entityTable: schema.moviesActors,
                filterColumn: schema.moviesActors.name,
            }),
            langs: createArrayFilterDef({
                argName: "langs",
                mediaTable: schema.movies,
                filterColumn: schema.movies.originalLanguage,
            }),
            directors: createArrayFilterDef({
                argName: "directors",
                mediaTable: schema.movies,
                filterColumn: schema.movies.directorName,
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
    ],
    jobDefinitions: {
        [JobType.ACTOR]: {
            sourceTable: schema.moviesActors,
            nameColumn: schema.moviesActors.name,
            mediaIdColumn: schema.moviesActors.mediaId,
        },
        [JobType.CREATOR]: {
            sourceTable: schema.movies,
            mediaIdColumn: schema.movies.id,
            nameColumn: schema.movies.directorName,
        },
        [JobType.COMPOSITOR]: {
            sourceTable: schema.movies,
            mediaIdColumn: schema.movies.id,
            nameColumn: schema.movies.compositorName,
        },
    },
    tablesForDeletion: [schema.moviesActors, schema.moviesGenre, schema.moviesLabels],
    achievements: moviesAchievements,
};
