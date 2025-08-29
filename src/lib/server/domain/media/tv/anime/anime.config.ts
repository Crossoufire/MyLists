import {JobType, Status} from "@/lib/server/utils/enums";
import * as schema from "@/lib/server/database/schema";
import {asc, desc, getTableColumns} from "drizzle-orm";
import {TvSchemaConfig} from "@/lib/types/media.config.types";
import {createArrayFilterDef} from "@/lib/server/domain/media/base/base.repository";
import {animeAchievements} from "@/lib/server/domain/media/tv/anime/achievements.seed";


export type AnimeSchemaConfig = TvSchemaConfig<
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
            ...getTableColumns(schema.animeList),
        },
        filterDefinitions: {
            actors: createArrayFilterDef({
                argName: "actors",
                mediaTable: schema.anime,
                entityTable: schema.animeActors,
                filterColumn: schema.animeActors.name,
            }),
            networks: createArrayFilterDef({
                argName: "networks",
                mediaTable: schema.anime,
                entityTable: schema.animeNetwork,
                filterColumn: schema.animeNetwork.name,
            }),
            creators: createArrayFilterDef({
                argName: "creators",
                mediaTable: schema.anime,
                filterColumn: schema.anime.createdBy,
            }),
            langs: createArrayFilterDef({
                argName: "langs",
                mediaTable: schema.anime,
                filterColumn: schema.anime.originCountry,
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
        "createdBy", "duration", "originCountry", "prodStatus", "synopsis"
    ],
    jobDefinitions: {
        [JobType.ACTOR]: {
            sourceTable: schema.animeActors,
            nameColumn: schema.animeActors.name,
            mediaIdColumn: schema.animeActors.mediaId,
        },
        [JobType.CREATOR]: {
            sourceTable: schema.anime,
            mediaIdColumn: schema.anime.id,
            nameColumn: schema.anime.createdBy,
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
            sourceTable: schema.animeNetwork,
            nameColumn: schema.animeNetwork.name,
            mediaIdColumn: schema.animeNetwork.mediaId,
        }
    },
    tablesForDeletion: [schema.animeActors, schema.animeGenre, schema.animeLabels],
    achievements: animeAchievements,
};
