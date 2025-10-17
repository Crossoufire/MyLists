import {MediaType} from "@/lib/utils/enums";
import {relations} from "drizzle-orm/relations";
import {user} from "@/lib/server/database/schema/auth.schema";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {communGenericCols, communMediaCols, communMediaLabelsCols, communMediaListCols} from "@/lib/server/database/schema/media/_helper";


export const manga = sqliteTable("manga", {
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
    apiId: integer().notNull(),
    ...communMediaCols(MediaType.MANGA),
});


export const mangaList = sqliteTable("manga_list", {
    currentChapter: integer().notNull(),
    redo: integer().default(0).notNull(),
    total: integer("total").default(0).notNull(),
    ...communMediaListCols(manga.id),
});


export const mangaGenre = sqliteTable("manga_genre", {
    ...communGenericCols(manga.id),
});


export const mangaAuthors = sqliteTable("manga_authors", {
    ...communGenericCols(manga.id),
});


export const mangaLabels = sqliteTable("manga_labels", {
    ...communMediaLabelsCols(manga.id),
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
