import * as schema from "@/lib/server/database/schema";
import {JobType, Status} from "@/lib/server/utils/enums";
import {and, asc, desc, eq, getTableColumns, like} from "drizzle-orm";
import {MediaSchemaConfig} from "@/lib/server/types/media-lists.types";
import {createListFilterDef} from "@/lib/server/domain/media/base/base.repository";
import {gamesAchievements} from "@/lib/server/domain/media/games/achievements.seed";


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
            mediaName: schema.games.name,
            imageCover: schema.games.imageCover,
            ...getTableColumns(schema.gamesList),
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
    ],
    jobDefinitions: {
        [JobType.CREATOR]: {
            sourceTable: schema.gamesCompanies,
            nameColumn: schema.gamesCompanies.name,
            mediaIdColumn: schema.gamesCompanies.mediaId,
            getFilter: (name) => and(like(schema.gamesCompanies.name, `%${name}%`), eq(schema.gamesCompanies.developer, true))
        }
    },
    tablesForDeletion: [schema.gamesCompanies, schema.gamesPlatforms, schema.gamesGenre, schema.gamesLabels],
    achievements: gamesAchievements,
};
