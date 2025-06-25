import {Status} from "@/lib/server/utils/enums";
import * as schema from "@/lib/server/database/schema";
import {asc, desc, getTableColumns, sql} from "drizzle-orm";
import {TVSchemaConfig} from "@/lib/server/types/media-lists.types";
import {createListFilterDef} from "@/lib/server/domain/media/base/base.repository";


export type SeriesSchemaConfig = TVSchemaConfig<
    typeof schema.series,
    typeof schema.seriesList,
    typeof schema.seriesGenre,
    typeof schema.seriesLabels,
    typeof schema.seriesActors,
    typeof schema.seriesNetwork,
    typeof schema.seriesEpisodesPerSeason
>;


export const seriesConfig: SeriesSchemaConfig = {
    mediaTable: schema.series,
    listTable: schema.seriesList,
    genreTable: schema.seriesGenre,
    labelTable: schema.seriesLabels,
    actorTable: schema.seriesActors,
    networkTable: schema.seriesNetwork,
    epsPerSeasonTable: schema.seriesEpisodesPerSeason,
    mediaList: {
        baseSelection: {
            mediaName: schema.series.name,
            imageCover: schema.series.imageCover,
            epsPerSeason: sql<{ season: number; episodes: number }[]>`(
                SELECT 
                    json_group_array(json_object(
                        'season', ${schema.seriesEpisodesPerSeason.season}, 
                        'episodes', ${schema.seriesEpisodesPerSeason.episodes}
                    ))
                FROM ${schema.seriesEpisodesPerSeason} 
                WHERE ${schema.seriesEpisodesPerSeason.mediaId} = ${schema.series.id}
            )`,
            ...getTableColumns(schema.seriesList),
        },
        filterDefinitions: {
            actors: createListFilterDef({
                argName: "actors",
                mediaTable: schema.series,
                entityTable: schema.seriesActors,
                filterColumn: schema.seriesActors.name,
            }),
            networks: createListFilterDef({
                argName: "networks",
                mediaTable: schema.series,
                entityTable: schema.seriesNetwork,
                filterColumn: schema.seriesNetwork.name,
            }),
        },
        defaultStatus: Status.WATCHING,
        defaultSortName: "Title A-Z",
        availableSorts: {
            "Title A-Z": asc(schema.series.name),
            "Title Z-A": desc(schema.series.name),
            "Release Date +": [desc(schema.series.releaseDate), asc(schema.series.name)],
            "Release Date -": [asc(schema.series.releaseDate), asc(schema.series.name)],
            "TMDB Rating +": [desc(schema.series.voteAverage), asc(schema.series.name)],
            "TMDB Rating -": [asc(schema.series.voteAverage), asc(schema.series.name)],
            "Rating +": [desc(schema.seriesList.rating), asc(schema.series.name)],
            "Rating -": [asc(schema.seriesList.rating), asc(schema.series.name)],
            "Re-watched": [desc(schema.seriesList.redo), asc(schema.series.name)],
        },
    },
    apiProvider: {
        maxGenres: 5,
    },
    editableFields: [
        "name", "originalName", "releaseDate", "lastAirDate", "homepage",
        "createdBy", "duration", "originCountry", "status", "synopsis"
    ] as const,
    tablesForDeletion: [schema.seriesActors, schema.seriesGenre, schema.seriesLabels],
};
