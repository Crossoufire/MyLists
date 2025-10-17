import {sql} from "drizzle-orm";
import {Status} from "@/lib/utils/enums";
import {relations} from "drizzle-orm/relations";
import {user} from "@/lib/server/database/schema/auth.schema";
import {customJson, imageUrl} from "@/lib/server/database/custom-types";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";


export const series = sqliteTable("series", {
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
    imageCover: imageUrl("image_cover", "series-covers").notNull(),
    apiId: integer().notNull(),
    lockStatus: integer({ mode: "boolean" }),
    episodeToAir: integer(),
    seasonToAir: integer(),
    nextEpisodeToAir: text(),
    lastApiUpdate: text(),
});


export const seriesList = sqliteTable("series_list", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer().notNull().references(() => series.id),
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


export const seriesGenre = sqliteTable("series_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => series.id),
    name: text().notNull(),
});


export const seriesActors = sqliteTable("series_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => series.id),
    name: text().notNull(),
});


export const seriesEpisodesPerSeason = sqliteTable("series_episodes_per_season", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => series.id),
    season: integer().notNull(),
    episodes: integer().notNull(),
});


export const seriesNetwork = sqliteTable("series_network", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => series.id),
    name: text().notNull(),
});


export const seriesLabels = sqliteTable("series_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer().notNull().references(() => series.id),
    name: text().notNull(),
});


export const seriesRelations = relations(series, ({ many }) => ({
    seriesEpisodesPerSeasons: many(seriesEpisodesPerSeason),
    seriesGenres: many(seriesGenre),
    seriesLabels: many(seriesLabels),
    seriesNetworks: many(seriesNetwork),
    seriesLists: many(seriesList),
    seriesActors: many(seriesActors),
}));


export const seriesListRelations = relations(seriesList, ({ one }) => ({
    user: one(user, {
        fields: [seriesList.userId],
        references: [user.id]
    }),
    series: one(series, {
        fields: [seriesList.mediaId],
        references: [series.id]
    }),
}));


export const seriesGenreRelations = relations(seriesGenre, ({ one }) => ({
    series: one(series, {
        fields: [seriesGenre.mediaId],
        references: [series.id]
    }),
}));


export const seriesEpisodesPerSeasonRelations = relations(seriesEpisodesPerSeason, ({ one }) => ({
    series: one(series, {
        fields: [seriesEpisodesPerSeason.mediaId],
        references: [series.id]
    }),
}));


export const seriesActorsRelations = relations(seriesActors, ({ one }) => ({
    series: one(series, {
        fields: [seriesActors.mediaId],
        references: [series.id]
    }),
}));


export const seriesNetworkRelations = relations(seriesNetwork, ({ one }) => ({
    series: one(series, {
        fields: [seriesNetwork.mediaId],
        references: [series.id]
    }),
}));


export const seriesLabelsRelations = relations(seriesLabels, ({ one }) => ({
    series: one(series, {
        fields: [seriesLabels.mediaId],
        references: [series.id]
    }),
    user: one(user, {
        fields: [seriesLabels.userId],
        references: [user.id]
    }),
}));
