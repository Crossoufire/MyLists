import {imageUrl} from "@/lib/server/database/custom-types";
import {GamesPlatformsEnum, Status} from "@/lib/utils/enums";
import {user} from "@/lib/server/database/schema/auth.schema";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {relations} from "drizzle-orm/relations";


export const games = sqliteTable("games", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    imageCover: imageUrl("image_cover", "games-covers").notNull(),
    gameEngine: text(),
    gameModes: text(),
    playerPerspective: text(),
    voteAverage: real(),
    voteCount: real(),
    releaseDate: text(),
    synopsis: text(),
    igdbUrl: text(),
    hltbMainTime: real(),
    hltbMainAndExtraTime: real(),
    hltbTotalCompleteTime: real(),
    apiId: integer().notNull(),
    lockStatus: integer({ mode: "boolean" }),
    lastApiUpdate: text(),
});


export const gamesList = sqliteTable("games_list", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer().notNull().references(() => games.id),
    status: text().$type<Status>().notNull(),
    playtime: integer().default(0),
    favorite: integer({ mode: "boolean" }),
    comment: text(),
    platform: text().$type<GamesPlatformsEnum>(),
    rating: real(),
});


export const gamesGenre = sqliteTable("games_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => games.id),
    name: text().notNull(),
});


export const gamesPlatforms = sqliteTable("games_platforms", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => games.id),
    name: text().notNull(),
});


export const gamesCompanies = sqliteTable("games_companies", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => games.id),
    name: text().notNull(),
    publisher: integer({ mode: "boolean" }),
    developer: integer({ mode: "boolean" }),
});


export const gamesLabels = sqliteTable("games_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer().notNull().references(() => games.id),
    name: text().notNull(),
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
