import {Status} from "@/lib/utils/enums";
import {relations} from "drizzle-orm/relations";
import {imageUrl} from "@/lib/server/database/custom-types";
import {user} from "@/lib/server/database/schema/auth.schema";
import {index, integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";


export const manga = sqliteTable("manga", {
    id: integer().primaryKey().notNull(),
    originalName: text(),
    chapters: integer(),
    prodStatus: text(),
    siteUrl: text(),
    endDate: text(),
    volumes: integer(),
    voteAverage: real(),
    voteCount: real(),
    popularity: real(),
    publishers: text(),
    name: text().notNull(),
    synopsis: text(),
    releaseDate: text(),
    imageCover: imageUrl("image_cover", "manga-covers").notNull(),
    apiId: integer().notNull(),
    lockStatus: integer({ mode: "boolean" }),
    lastApiUpdate: text(),
});


export const mangaList = sqliteTable("manga_list", {
        id: integer().primaryKey().notNull(),
        mediaId: integer().notNull().references(() => manga.id),
        userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
        currentChapter: integer().notNull(),
        total: integer().default(0).notNull(),
        redo: integer().default(0).notNull(),
        status: text().$type<Status>().notNull(),
        favorite: integer({ mode: "boolean" }),
        rating: real(),
        comment: text(),
    },
    (table) => [
        index("ix_manga_list_id").on(table.id),
        index("ix_manga_list_user_id").on(table.userId),
    ]);


export const mangaGenre = sqliteTable("manga_genre", {
    mediaId: integer().notNull().references(() => manga.id),
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
});


export const mangaAuthors = sqliteTable("manga_authors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => manga.id),
    name: text().notNull(),
});


export const mangaRelations = relations(manga, ({ many }) => ({
    mangaLists: many(mangaList),
    mangaAuthors: many(mangaAuthors),
    mangaGenres: many(mangaGenre),
    mangaLabels: many(mangaLabels),
}));


export const mangaListRelations = relations(mangaList, ({ one }) => ({
    user: one(user, {
        fields: [mangaList.userId],
        references: [user.id]
    }),
    manga: one(manga, {
        fields: [mangaList.mediaId],
        references: [manga.id]
    }),
}));


export const mangaAuthorsRelations = relations(mangaAuthors, ({ one }) => ({
    manga: one(manga, {
        fields: [mangaAuthors.mediaId],
        references: [manga.id]
    }),
}));


export const mangaGenreRelations = relations(mangaGenre, ({ one }) => ({
    manga: one(manga, {
        fields: [mangaGenre.mediaId],
        references: [manga.id]
    }),
}));


export const mangaLabels = sqliteTable("manga_labels", {
        mediaId: integer().notNull().references(() => manga.id),
        id: integer().primaryKey().notNull(),
        userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
        name: text().notNull(),
    },
    (table) => [index("ix_manga_labels_user_id").on(table.userId)]);


export const mangaLabelsRelations = relations(mangaLabels, ({ one }) => ({
    user: one(user, {
        fields: [mangaLabels.userId],
        references: [user.id]
    }),
    manga: one(manga, {
        fields: [mangaLabels.mediaId],
        references: [manga.id]
    }),
}));
