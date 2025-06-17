import {asc, desc} from "drizzle-orm";
import {Status} from "@/lib/server/utils/enums";
import * as schema from "@/lib/server/database/schema";
import {MediaSchemaConfig, RelatedEntityConfig} from "@/lib/server/types/media-lists.types";


export type GamesSchemaConfig = MediaSchemaConfig<
    typeof schema.games,
    typeof schema.gamesList,
    typeof schema.gamesGenre,
    typeof schema.gamesLabels
> & {
    genreConfig: RelatedEntityConfig<typeof schema.games, typeof schema.gamesGenre>;
    companyConfig: RelatedEntityConfig<typeof schema.games, typeof schema.gamesCompanies>;
    platformConfig: RelatedEntityConfig<typeof schema.games, typeof schema.gamesPlatforms>;
};


export const gamesConfig: GamesSchemaConfig = {
    mediaTable: schema.games,
    listTable: schema.gamesList,
    genreTable: schema.gamesGenre,
    labelTable: schema.gamesLabels,
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
    genreConfig: {
        entityTable: schema.gamesGenre,
        filterColumnInEntity: schema.gamesGenre.name,
        mediaIdColumnInEntity: schema.gamesGenre.mediaId,
        idColumnInMedia: schema.games.id,
    },
    companyConfig: {
        entityTable: schema.gamesCompanies,
        filterColumnInEntity: schema.gamesCompanies.name,
        mediaIdColumnInEntity: schema.gamesCompanies.mediaId,
        idColumnInMedia: schema.games.id,
    },
    platformConfig: {
        entityTable: schema.gamesPlatforms,
        filterColumnInEntity: schema.gamesPlatforms.name,
        mediaIdColumnInEntity: schema.gamesPlatforms.mediaId,
        idColumnInMedia: schema.games.id,
    },
    maxGenres: 5,
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
    editableFields: [
        "name", "gameEngine", "gameModes", "playerPerspective", "releaseDate", "synopsis",
        "hltbMainTime", "hltbMainAndExtraTime", "hltbTotalCompleteTime"
    ] as const,
};


