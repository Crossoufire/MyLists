import {sql} from "drizzle-orm";
import {relations} from "drizzle-orm/relations";
import {user} from "@/lib/server/database/schema/auth.schema";
import {customJson} from "@/lib/server/database/custom-types";
import {index, integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {animeLabels, animeList} from "@/lib/server/database/schema/anime.schema";
import {gamesLabels, gamesList} from "@/lib/server/database/schema/games.schema";
import {booksLabels, booksList} from "@/lib/server/database/schema/books.schema";
import {mangaLabels, mangaList} from "@/lib/server/database/schema/manga.schema";
import {userAchievement} from "@/lib/server/database/schema/achievements.schema";
import {MediaType, NotificationType, Status, UpdateType} from "@/lib/utils/enums";
import {seriesLabels, seriesList} from "@/lib/server/database/schema/series.schema";
import {moviesLabels, moviesList} from "@/lib/server/database/schema/movies.schema";
import {mediadleStats, userMediadleProgress} from "@/lib/server/database/schema/mediadle.schema";


export const followers = sqliteTable("followers", {
    followerId: integer().references(() => user.id, { onDelete: "cascade" }),
    followedId: integer().references(() => user.id, { onDelete: "cascade" }),
});


export const notifications = sqliteTable("notifications", {
        id: integer().primaryKey().notNull(),
        userId: integer().references(() => user.id, { onDelete: "cascade" }),
        mediaType: text().$type<MediaType>(),
        mediaId: integer(),
        payload: customJson<Record<string, any>>("payload").notNull(),
        notificationType: text().$type<NotificationType>(),
        timestamp: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    },
    (table) => [index("ix_notifications_timestamp").on(table.timestamp)]);


export const userMediaUpdate = sqliteTable("user_media_update", {
        id: integer().primaryKey().notNull(),
        userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
        mediaId: integer().notNull(),
        mediaName: text().notNull(),
        mediaType: text().$type<MediaType>().notNull(),
        updateType: text().$type<UpdateType>().notNull(),
        payload: customJson<{ old_value: any, new_value: any }>("payload"),
        timestamp: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    },
    (table) => [
        index("ix_user_media_update_media_id").on(table.mediaId),
        index("ix_user_media_update_timestamp").on(table.timestamp),
        index("ix_user_media_update_media_type").on(table.mediaType),
        index("ix_user_media_update_user_id").on(table.userId),
    ]);


export const userMediaSettings = sqliteTable("user_media_settings", {
        id: integer().primaryKey().notNull(),
        userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
        mediaType: text().$type<MediaType>().notNull(),
        timeSpent: integer().default(0).notNull(),
        views: integer().default(0).notNull(),
        active: integer({ mode: "boolean" }).notNull(),
        totalEntries: integer().default(0).notNull(),
        totalRedo: integer().default(0).notNull(),
        entriesRated: integer().default(0).notNull(),
        sumEntriesRated: integer().default(0).notNull(),
        entriesCommented: integer().default(0).notNull(),
        entriesFavorites: integer().default(0).notNull(),
        totalSpecific: integer().default(0).notNull(),
        statusCounts: customJson<Record<Partial<Status>, number>>("status_counts").default(sql`'{}'`).notNull(),
        averageRating: real(),
    },
    (table) => [
        index("ix_user_media_settings_user_id").on(table.userId),
        index("ix_user_media_settings_media_type").on(table.mediaType),
    ]);


export const userRelations = relations(user, ({ many }) => ({
    followers_followedId: many(followers, {
        relationName: "followers_followedId_user_id"
    }),
    followers_followerId: many(followers, {
        relationName: "followers_followerId_user_id"
    }),
    userMediaUpdates: many(userMediaUpdate),
    seriesLabels: many(seriesLabels),
    animeLabels: many(animeLabels),
    moviesLabels: many(moviesLabels),
    gamesLabels: many(gamesLabels),
    booksLabels: many(booksLabels),
    mangaLabels: many(mangaLabels),
    mangaLists: many(mangaList),
    moviesLists: many(moviesList),
    gamesLists: many(gamesList),
    booksLists: many(booksList),
    animeLists: many(animeList),
    seriesLists: many(seriesList),
    notifications: many(notifications),
    mediadleStats: many(mediadleStats),
    userAchievements: many(userAchievement),
    userMediaSettings: many(userMediaSettings),
    userMediadleProgresses: many(userMediadleProgress),
}));


export const followersRelations = relations(followers, ({ one }) => ({
    user_followedId: one(user, {
        fields: [followers.followedId],
        references: [user.id],
        relationName: "followers_followedId_user_id"
    }),
    user_followerId: one(user, {
        fields: [followers.followerId],
        references: [user.id],
        relationName: "followers_followerId_user_id"
    }),
}));


export const userMediaUpdateRelations = relations(userMediaUpdate, ({ one }) => ({
    user: one(user, {
        fields: [userMediaUpdate.userId],
        references: [user.id]
    }),
}));


export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(user, {
        fields: [notifications.userId],
        references: [user.id]
    }),
}));


export const userMediaSettingsRelations = relations(userMediaSettings, ({ one }) => ({
    user: one(user, {
        fields: [userMediaSettings.userId],
        references: [user.id]
    }),
}));
