import {JobType, Status} from "@/lib/utils/enums";
import {createArrayFilterDef} from "../base/base.repository";
import {asc, desc, getTableColumns} from "drizzle-orm";
import {MediaSchemaConfig} from "@/lib/types/media.config.types";
import {moviesAchievements} from "@/lib/server/domain/media/movies/achievements.seed";
import {movies, moviesActors, moviesGenre, moviesLabels, moviesList} from "@/lib/server/database/schema/media/movies.schema";


export type MovieSchemaConfig = MediaSchemaConfig<
    typeof movies,
    typeof moviesList,
    typeof moviesGenre,
    typeof moviesLabels
>;


export const moviesConfig: MovieSchemaConfig = {
    mediaTable: movies,
    listTable: moviesList,
    genreTable: moviesGenre,
    labelTable: moviesLabels,
    mediaList: {
        baseSelection: {
            mediaName: movies.name,
            imageCover: movies.imageCover,
            ...getTableColumns(moviesList),
        },
        filterDefinitions: {
            actors: createArrayFilterDef({
                argName: "actors",
                mediaTable: movies,
                entityTable: moviesActors,
                filterColumn: moviesActors.name,
            }),
            langs: createArrayFilterDef({
                argName: "langs",
                mediaTable: movies,
                filterColumn: movies.originalLanguage,
            }),
            directors: createArrayFilterDef({
                argName: "directors",
                mediaTable: movies,
                filterColumn: movies.directorName,
            }),
        },
        defaultStatus: Status.COMPLETED,
        defaultSortName: "Title A-Z",
        availableSorts: {
            "Title A-Z": asc(movies.name),
            "Title Z-A": desc(movies.name),
            "Rating +": [desc(moviesList.rating), asc(movies.name)],
            "Rating -": [asc(moviesList.rating), asc(movies.name)],
            "TMDB Rating +": [desc(movies.voteAverage), asc(movies.name)],
            "TMDB Rating -": [asc(movies.voteAverage), asc(movies.name)],
            "Release Date +": [desc(movies.releaseDate), asc(movies.name)],
            "Release Date -": [asc(movies.releaseDate), asc(movies.name)],
            "Recently Added": [desc(moviesList.addedAt), asc(movies.name)],
            "Re-Watched": [desc(moviesList.redo), asc(movies.name)],
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
            sourceTable: moviesActors,
            nameColumn: moviesActors.name,
            mediaIdColumn: moviesActors.mediaId,
        },
        [JobType.CREATOR]: {
            sourceTable: movies,
            mediaIdColumn: movies.id,
            nameColumn: movies.directorName,
        },
        [JobType.COMPOSITOR]: {
            sourceTable: movies,
            mediaIdColumn: movies.id,
            nameColumn: movies.compositorName,
        },
    },
    tablesForDeletion: [moviesActors, moviesGenre, moviesLabels],
    achievements: moviesAchievements,
};
