import {sql} from "drizzle-orm";
import {MediaType} from "@/lib/utils/enums";
import {relations} from "drizzle-orm/relations";
import {user} from "@/lib/server/database/schema/auth.schema";
import {customJson} from "@/lib/server/database/custom-types";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {communGenericCols, communMediaCollectionsCols, communMediaCols, communMediaEpsCols, communMediaListCols} from "@/lib/server/database/schema/media/_helper";


export const anime = sqliteTable("anime", {
    originalName: text(),
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
    popularity: real(),
    apiId: integer().unique().notNull(),
    seasonToAir: integer(),
    episodeToAir: integer(),
    nextEpisodeToAir: text(),
    ...communMediaCols(MediaType.ANIME)
});


export const animeList = sqliteTable("anime_list", {
    currentSeason: integer().notNull(),
    currentEpisode: integer().notNull(),
    redo: integer().default(0).notNull(),
    total: integer("total").default(0).notNull(),
    redo2: customJson<number[]>("redo2").default(sql`'[]'`).notNull(),
    ...communMediaListCols(anime.id),
});


export const animeGenre = sqliteTable("anime_genre", {
    ...communGenericCols(anime.id),
});


export const animeActors = sqliteTable("anime_actors", {
    ...communGenericCols(anime.id),
});


export const animeNetwork = sqliteTable("anime_network", {
    ...communGenericCols(anime.id),
});


export const animeEpisodesPerSeason = sqliteTable("anime_episodes_per_season", {
    ...communMediaEpsCols(anime.id),
});


export const animeCollections = sqliteTable("anime_collections", {
    ...communMediaCollectionsCols(anime.id),
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
    animeCollections: many(animeCollections),
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


export const animeCollectionsRelations = relations(animeCollections, ({ one }) => ({
    user: one(user, {
        fields: [animeCollections.userId],
        references: [user.id]
    }),
    anime: one(anime, {
        fields: [animeCollections.mediaId],
        references: [anime.id]
    }),
}));
