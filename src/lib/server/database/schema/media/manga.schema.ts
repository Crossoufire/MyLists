import {MediaType} from "@/lib/utils/enums";
import {relations} from "drizzle-orm/relations";
import {user} from "@/lib/server/database/schema/auth.schema";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {commonGenericCols, commonMediaCollectionsCols, commonMediaCols, commonMediaListCols} from "@/lib/server/database/schema/media/_helper";


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
    apiId: integer().unique().notNull(),
    ...commonMediaCols(MediaType.MANGA),
});


export const mangaList = sqliteTable("manga_list", {
    currentChapter: integer().notNull(),
    redo: integer().default(0).notNull(),
    total: integer("total").default(0).notNull(),
    ...commonMediaListCols(manga.id),
});


export const mangaGenre = sqliteTable("manga_genre", {
    ...commonGenericCols(manga.id),
});


export const mangaAuthors = sqliteTable("manga_authors", {
    ...commonGenericCols(manga.id),
});


export const mangaCollections = sqliteTable("manga_collections", {
    ...commonMediaCollectionsCols(manga.id),
});


export const mangaRelations = relations(manga, ({ many }) => ({
    mangaLists: many(mangaList),
    mangaAuthors: many(mangaAuthors),
    mangaGenres: many(mangaGenre),
    mangaCollections: many(mangaCollections),
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


export const mangaCollectionsRelations = relations(mangaCollections, ({ one }) => ({
    user: one(user, {
        fields: [mangaCollections.userId],
        references: [user.id]
    }),
    manga: one(manga, {
        fields: [mangaCollections.mediaId],
        references: [manga.id]
    }),
}));
