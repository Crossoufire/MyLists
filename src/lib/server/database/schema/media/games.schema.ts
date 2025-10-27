import {relations} from "drizzle-orm/relations";
import {user} from "@/lib/server/database/schema/auth.schema";
import {GamesPlatformsEnum, MediaType} from "@/lib/utils/enums";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {communGenericCols, communMediaCols, communMediaLabelsCols, communMediaListCols} from "@/lib/server/database/schema/media/_helper";


export const games = sqliteTable("games", {
    gameEngine: text(),
    gameModes: text(),
    playerPerspective: text(),
    voteAverage: real(),
    voteCount: real(),
    igdbUrl: text(),
    hltbMainTime: real(),
    hltbMainAndExtraTime: real(),
    hltbTotalCompleteTime: real(),
    apiId: integer().unique().notNull(),
    ...communMediaCols(MediaType.GAMES),
});


export const gamesList = sqliteTable("games_list", {
    playtime: integer().default(0),
    platform: text().$type<GamesPlatformsEnum>(),
    ...communMediaListCols(games.id),
});


export const gamesGenre = sqliteTable("games_genre", {
    ...communGenericCols(games.id),
});


export const gamesPlatforms = sqliteTable("games_platforms", {
    ...communGenericCols(games.id),
});


export const gamesCompanies = sqliteTable("games_companies", {
    ...communGenericCols(games.id),
    publisher: integer({ mode: "boolean" }),
    developer: integer({ mode: "boolean" }),
});


export const gamesLabels = sqliteTable("games_labels", {
    ...communMediaLabelsCols(games.id),
});


export const gamesRelations = relations(games, ({ many }) => ({
    gamesPlatforms: many(gamesPlatforms),
    gamesCompanies: many(gamesCompanies),
    gamesGenres: many(gamesGenre),
    gamesLabels: many(gamesLabels),
    gamesLists: many(gamesList),
}));


export const gamesListRelations = relations(gamesList, ({ one }) => ({
    user: one(user, {
        fields: [gamesList.userId],
        references: [user.id]
    }),
    game: one(games, {
        fields: [gamesList.mediaId],
        references: [games.id]
    }),
}));


export const gamesPlatformsRelations = relations(gamesPlatforms, ({ one }) => ({
    game: one(games, {
        fields: [gamesPlatforms.mediaId],
        references: [games.id]
    }),
}));


export const gamesCompaniesRelations = relations(gamesCompanies, ({ one }) => ({
    game: one(games, {
        fields: [gamesCompanies.mediaId],
        references: [games.id]
    }),
}));


export const gamesGenreRelations = relations(gamesGenre, ({ one }) => ({
    game: one(games, {
        fields: [gamesGenre.mediaId],
        references: [games.id]
    }),
}));


export const gamesLabelsRelations = relations(gamesLabels, ({ one }) => ({
    game: one(games, {
        fields: [gamesLabels.mediaId],
        references: [games.id]
    }),
    user: one(user, {
        fields: [gamesLabels.userId],
        references: [user.id]
    }),
}));
