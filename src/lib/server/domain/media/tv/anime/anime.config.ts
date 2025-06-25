import {Status} from "@/lib/server/utils/enums";
import {asc, desc, getTableColumns, sql} from "drizzle-orm";
import * as schema from "@/lib/server/database/schema";
import {TVSchemaConfig} from "@/lib/server/types/media-lists.types";
import {createListFilterDef} from "@/lib/server/domain/media/base/base.repository";


export type AnimeSchemaConfig = TVSchemaConfig<
    typeof schema.anime,
    typeof schema.animeList,
    typeof schema.animeGenre,
    typeof schema.animeLabels,
    typeof schema.animeActors,
    typeof schema.animeNetwork,
    typeof schema.animeEpisodesPerSeason
>;


export const animeConfig: AnimeSchemaConfig = {
    mediaTable: schema.anime,
    listTable: schema.animeList,
    genreTable: schema.animeGenre,
    labelTable: schema.animeLabels,
    actorTable: schema.animeActors,
    networkTable: schema.animeNetwork,
    epsPerSeasonTable: schema.animeEpisodesPerSeason,
    mediaList: {
        baseSelection: {
            mediaName: schema.anime.name,
            imageCover: schema.anime.imageCover,
            epsPerSeason: sql<{ season: number; episodes: number }[]>`(
                SELECT 
                    json_group_array(json_object(
                        'season', ${schema.animeEpisodesPerSeason.season}, 
                        'episodes', ${schema.animeEpisodesPerSeason.episodes}
                    ))
                FROM ${schema.animeEpisodesPerSeason} 
                WHERE ${schema.animeEpisodesPerSeason.mediaId} = ${schema.anime.id}
            )`,
            ...getTableColumns(schema.animeList),
        },
        filterDefinitions: {
            actors: createListFilterDef({
                argName: "actors",
                mediaTable: schema.anime,
                entityTable: schema.animeActors,
                filterColumn: schema.animeActors.name,
            }),
            networks: createListFilterDef({
                argName: "networks",
                mediaTable: schema.anime,
                entityTable: schema.animeNetwork,
                filterColumn: schema.animeNetwork.name,
            }),
        },
        defaultStatus: Status.WATCHING,
        defaultSortName: "Title A-Z",
        availableSorts: {
            "Title A-Z": asc(schema.anime.name),
            "Title Z-A": desc(schema.anime.name),
            "Release Date +": [desc(schema.anime.releaseDate), asc(schema.anime.name)],
            "Release Date -": [asc(schema.anime.releaseDate), asc(schema.anime.name)],
            "TMDB Rating +": [desc(schema.anime.voteAverage), asc(schema.anime.name)],
            "TMDB Rating -": [asc(schema.anime.voteAverage), asc(schema.anime.name)],
            "Rating +": [desc(schema.animeList.rating), asc(schema.anime.name)],
            "Rating -": [asc(schema.animeList.rating), asc(schema.anime.name)],
            "Re-watched": [desc(schema.animeList.redo), asc(schema.anime.name)],
        },
    },
    apiProvider: {
        maxGenres: 5,
    },
    editableFields: [
        "name", "originalName", "releaseDate", "lastAirDate", "homepage",
        "createdBy", "duration", "originCountry", "status", "synopsis"
    ] as const,
    tablesForDeletion: [schema.animeActors, schema.animeGenre, schema.animeLabels],
};
