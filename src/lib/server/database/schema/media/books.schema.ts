import {MediaType} from "@/lib/utils/enums";
import {relations} from "drizzle-orm/relations";
import {user} from "@/lib/server/database/schema/auth.schema";
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {communGenericCols, communMediaCols, communMediaLabelsCols, communMediaListCols} from "@/lib/server/database/schema/media/_helper";


export const books = sqliteTable("books", {
    pages: integer().notNull(),
    language: text(),
    publishers: text(),
    apiId: text().notNull(),
    ...communMediaCols(MediaType.BOOKS),
});


export const booksList = sqliteTable("books_list", {
    actualPage: integer(),
    redo: integer().default(0).notNull(),
    total: integer("total").default(0).notNull(),
    ...communMediaListCols(books.id),
});


export const booksGenre = sqliteTable("books_genre", {
    ...communGenericCols(books.id),
});


export const booksAuthors = sqliteTable("books_authors", {
    ...communGenericCols(books.id),
});


export const booksLabels = sqliteTable("books_labels", {
    ...communMediaLabelsCols(books.id),
});


export const booksRelations = relations(books, ({ many }) => ({
    booksAuthors: many(booksAuthors),
    booksGenres: many(booksGenre),
    booksLabels: many(booksLabels),
    booksLists: many(booksList),
}));


export const booksListRelations = relations(booksList, ({ one }) => ({
    user: one(user, {
        fields: [booksList.userId],
        references: [user.id]
    }),
    book: one(books, {
        fields: [booksList.mediaId],
        references: [books.id]
    }),
}));


export const booksAuthorsRelations = relations(booksAuthors, ({ one }) => ({
    book: one(books, {
        fields: [booksAuthors.mediaId],
        references: [books.id]
    }),
}));


export const booksGenreRelations = relations(booksGenre, ({ one }) => ({
    book: one(books, {
        fields: [booksGenre.mediaId],
        references: [books.id]
    }),
}));


export const booksLabelsRelations = relations(booksLabels, ({ one }) => ({
    user: one(user, {
        fields: [booksLabels.userId],
        references: [user.id]
    }),
    book: one(books, {
        fields: [booksLabels.mediaId],
        references: [books.id]
    }),
}));
