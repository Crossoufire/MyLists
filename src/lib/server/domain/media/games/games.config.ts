import {asc, desc} from "drizzle-orm";
import {Status} from "@/lib/server/utils/enums";
import * as schema from "@/lib/server/database/schema";
import {MediaSchemaConfig} from "@/lib/server/types/media-lists.types";
import {createListFilterDef} from "@/lib/server/domain/media/base/base.repository";


export type GamesSchemaConfig = MediaSchemaConfig<
    typeof schema.games,
    typeof schema.gamesList,
    typeof schema.gamesGenre,
    typeof schema.gamesLabels
>;


export const gamesConfig: GamesSchemaConfig = {
    mediaTable: schema.games,
    listTable: schema.gamesList,
    genreTable: schema.gamesGenre,
    labelTable: schema.gamesLabels,
    mediaList: {
        baseSelection: {
            userId: schema.gamesList.userId,
            imageCover: schema.games.imageCover,
            mediaId: schema.gamesList.mediaId,
            status: schema.gamesList.status,
            rating: schema.gamesList.rating,
            favorite: schema.gamesList.favorite,
            comment: schema.gamesList.comment,
            mediaName: schema.games.name,
            playtime: schema.gamesList.playtime,
            platform: schema.gamesList.platform,
        },
        filterDefinitions: {
            platforms: createListFilterDef({
                argName: "platforms",
                mediaTable: schema.games,
                entityTable: schema.gamesPlatforms,
                filterColumn: schema.gamesPlatforms.name,
            }),
            companies: createListFilterDef({
                argName: "companies",
                mediaTable: schema.games,
                entityTable: schema.gamesCompanies,
                filterColumn: schema.gamesCompanies.name,
            }),
        },
        defaultStatus: Status.PLAYING,
        defaultSortName: "Playtime +",
        availableSorts: {
            "Title A-Z": asc(schema.games.name),
            "Title Z-A": desc(schema.games.name),
            "Release Date +": [desc(schema.games.releaseDate), asc(schema.games.name)],
            "Release Date -": [asc(schema.games.releaseDate), asc(schema.games.name)],
            "IGDB Rating +": [desc(schema.games.voteAverage), asc(schema.games.name)],
            "IGDB Rating -": [asc(schema.games.voteAverage), asc(schema.games.name)],
            "Rating +": [desc(schema.gamesList.rating), asc(schema.games.name)],
            "Rating -": [asc(schema.gamesList.rating), asc(schema.games.name)],
            "Playtime +": [desc(schema.gamesList.playtime), asc(schema.games.name)],
            "Playtime -": [asc(schema.gamesList.playtime), asc(schema.games.name)],
        },
    },
    apiProvider: {
        maxGenres: 5,
    },
    editableFields: [
        "name", "gameEngine", "gameModes", "playerPerspective", "releaseDate", "synopsis",
        "hltbMainTime", "hltbMainAndExtraTime", "hltbTotalCompleteTime"
    ] as const,
    tablesForDeletion: [schema.gamesCompanies, schema.gamesPlatforms, schema.gamesGenre, schema.gamesLabels],
};


