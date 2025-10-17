import {sql} from "drizzle-orm";
import {Status} from "@/lib/utils/enums";
import {relations} from "drizzle-orm/relations";
import {user} from "@/lib/server/database/schema/auth.schema";
import {customJson, imageUrl} from "@/lib/server/database/custom-types";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";


export const anime = sqliteTable("anime", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    originalName: text(),
    releaseDate: text(),
    lastAirDate: text(),
    homepage: text(),
    createdBy: text(),
    duration: integer().notNull(),
    totalSeasons: integer().notNull(),
    totalEpisodes: integer().notNull(),
    originCountry: text(),
    prodStatus: text(),
    voteAverage: real(),
    voteCount: real(),
    synopsis: text(),
    popularity: real(),
    imageCover: imageUrl("image_cover", "anime-covers").notNull(),
    apiId: integer().notNull(),
    lockStatus: integer({ mode: "boolean" }),
    seasonToAir: integer(),
    episodeToAir: integer(),
    nextEpisodeToAir: text(),
    lastApiUpdate: text(),
});


export const animeList = sqliteTable("anime_list", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer().notNull().references(() => anime.id),
    currentSeason: integer().notNull(),
    currentEpisode: integer().notNull(),
    status: text().$type<Status>().notNull(),
    favorite: integer({ mode: "boolean" }),
    redo: integer().default(0).notNull(),
    comment: text(),
    total: integer().default(0).notNull(),
    rating: real(),
    redo2: customJson<number[]>("redo2").default(sql`'[]'`).notNull(),
});


export const animeGenre = sqliteTable("anime_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => anime.id),
    name: text().notNull(),
});


export const animeActors = sqliteTable("anime_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => anime.id),
    name: text().notNull(),
});


export const animeEpisodesPerSeason = sqliteTable("anime_episodes_per_season", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => anime.id),
    season: integer().notNull(),
    episodes: integer().notNull(),
});


export const animeNetwork = sqliteTable("anime_network", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => anime.id),
    name: text().notNull(),
});


export const animeLabels = sqliteTable("anime_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer().notNull().references(() => anime.id),
    name: text().notNull(),
});


export const animeEpisodesPerSeasonRelations = relations(animeEpisodesPerSeason, ({ one }) => ({
    anime: one(anime, {
        fields: [animeEpisodesPerSeason.mediaId],
        references: [anime.id]
    }),
}));


export const animeRelations = relations(anime, ({ many }) => ({
    animeEpisodesPerSeasons: many(animeEpisodesPerSeason),
    animeGenres: many(animeGenre),
    animeLabels: many(animeLabels),
    animeNetworks: many(animeNetwork),
    animeLists: many(animeList),
}));


export const animeListRelations = relations(animeList, ({ one }) => ({
    anime: one(anime, {
        fields: [animeList.mediaId],
        references: [anime.id]
    }),
    user: one(user, {
        fields: [animeList.userId],
        references: [user.id]
    }),
}));


export const animeGenreRelations = relations(animeGenre, ({ one }) => ({
    anime: one(anime, {
        fields: [animeGenre.mediaId],
        references: [anime.id]
    }),
}));


export const animeNetworkRelations = relations(animeNetwork, ({ one }) => ({
    anime: one(anime, {
        fields: [animeNetwork.mediaId],
        references: [anime.id]
    }),
}));


export const animeLabelsRelations = relations(animeLabels, ({ one }) => ({
    user: one(user, {
        fields: [animeLabels.userId],
        references: [user.id]
    }),
    anime: one(anime, {
        fields: [animeLabels.mediaId],
        references: [anime.id]
    }),
}));
