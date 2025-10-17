import {JobType, Status} from "@/lib/utils/enums";
import {asc, desc, getTableColumns} from "drizzle-orm";
import {TvSchemaConfig} from "@/lib/types/media.config.types";
import {createArrayFilterDef} from "@/lib/server/domain/media/base/base.repository";
import {animeAchievements} from "@/lib/server/domain/media/tv/anime/achievements.seed";
import {anime, animeActors, animeEpisodesPerSeason, animeGenre, animeLabels, animeList, animeNetwork} from "@/lib/server/database/schema/media/anime.schema";


export type AnimeSchemaConfig = TvSchemaConfig<
    typeof anime,
    typeof animeList,
    typeof animeGenre,
    typeof animeLabels,
    typeof animeActors,
    typeof animeNetwork,
    typeof animeEpisodesPerSeason
>;


export const animeConfig: AnimeSchemaConfig = {
    mediaTable: anime,
    listTable: animeList,
    genreTable: animeGenre,
    labelTable: animeLabels,
    actorTable: animeActors,
    networkTable: animeNetwork,
    epsPerSeasonTable: animeEpisodesPerSeason,
    mediaList: {
        baseSelection: {
            mediaName: anime.name,
            imageCover: anime.imageCover,
            ...getTableColumns(animeList),
        },
        filterDefinitions: {
            actors: createArrayFilterDef({
                argName: "actors",
                mediaTable: anime,
                entityTable: animeActors,
                filterColumn: animeActors.name,
            }),
            networks: createArrayFilterDef({
                argName: "networks",
                mediaTable: anime,
                entityTable: animeNetwork,
                filterColumn: animeNetwork.name,
            }),
            creators: createArrayFilterDef({
                argName: "creators",
                mediaTable: anime,
                filterColumn: anime.createdBy,
            }),
            langs: createArrayFilterDef({
                argName: "langs",
                mediaTable: anime,
                filterColumn: anime.originCountry,
            }),
        },
        defaultStatus: Status.WATCHING,
        defaultSortName: "Title A-Z",
        availableSorts: {
            "Title A-Z": asc(anime.name),
            "Title Z-A": desc(anime.name),
            "Release Date +": [desc(anime.releaseDate), asc(anime.name)],
            "Release Date -": [asc(anime.releaseDate), asc(anime.name)],
            "TMDB Rating +": [desc(anime.voteAverage), asc(anime.name)],
            "TMDB Rating -": [asc(anime.voteAverage), asc(anime.name)],
            "Rating +": [desc(animeList.rating), asc(anime.name)],
            "Rating -": [asc(animeList.rating), asc(anime.name)],
            "Re-watched": [desc(animeList.redo), asc(anime.name)],
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
            sourceTable: animeActors,
            nameColumn: animeActors.name,
            mediaIdColumn: animeActors.mediaId,
        },
        [JobType.CREATOR]: {
            sourceTable: anime,
            mediaIdColumn: anime.id,
            nameColumn: anime.createdBy,
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
            sourceTable: animeNetwork,
            nameColumn: animeNetwork.name,
            mediaIdColumn: animeNetwork.mediaId,
        }
    },
    tablesForDeletion: [animeActors, animeGenre, animeLabels],
    achievements: animeAchievements,
};
