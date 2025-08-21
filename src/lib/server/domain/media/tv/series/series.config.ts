import * as schema from "@/lib/server/database/schema";
import {JobType, Status} from "@/lib/server/utils/enums";
import {MediaListArgs} from "@/lib/server/types/base.types";
import {TvSchemaConfig} from "@/lib/server/types/media-lists.types";
import {asc, desc, getTableColumns, inArray, sql} from "drizzle-orm";
import {createListFilterDef} from "@/lib/server/domain/media/base/base.repository";
import {seriesAchievements} from "@/lib/server/domain/media/tv/series/achievements.seed";


export type SeriesSchemaConfig = TvSchemaConfig<
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
            )`.mapWith(JSON.parse),
            ...getTableColumns(schema.seriesList),
        },
        filterDefinitions: {
            creators: {
                isActive: (args: MediaListArgs) => !!args.creators,
                getCondition: (args: MediaListArgs) => {
                    return inArray(schema.series.createdBy, args.creators!.filter((c) => c !== "All"))
                },
            },
            langs: {
                isActive: (args: MediaListArgs) => !!args.langs,
                getCondition: (args: MediaListArgs) => {
                    return inArray(schema.series.originCountry, args.langs!.filter((l) => l !== "All"))
                },
            },
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
        "createdBy", "duration", "originCountry", "prodStatus", "synopsis"
    ],
    jobDefinitions: {
        [JobType.ACTOR]: {
            sourceTable: schema.seriesActors,
            nameColumn: schema.seriesActors.name,
            mediaIdColumn: schema.seriesActors.mediaId,
        },
        [JobType.CREATOR]: {
            mediaIdColumn: schema.series.id,
            sourceTable: schema.series,
            nameColumn: schema.series.createdBy,
            postProcess: (results: { name: string | null }[]) => {
                return Array.from(
                    new Map(results
                        .filter((c) => c.name)
                        .flatMap((c) => c.name!.split(","))
                        .map((n) => n.trim())
                        .filter(Boolean)
                        .map((n) => [n, { name: n }])
                    ).values()
                );
            },
        },
        [JobType.PLATFORM]: {
            sourceTable: schema.seriesNetwork,
            nameColumn: schema.seriesNetwork.name,
            mediaIdColumn: schema.seriesNetwork.mediaId,
        }
    },
    tablesForDeletion: [schema.seriesActors, schema.seriesGenre, schema.seriesLabels],
    achievements: seriesAchievements,
};
