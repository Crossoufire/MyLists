import {Status} from "@/lib/utils/enums";
import {relations} from "drizzle-orm/relations";
import {imageUrl} from "@/lib/server/database/custom-types";
import {user} from "@/lib/server/database/schema/auth.schema";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";


export const books = sqliteTable("books", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    releaseDate: text(),
    pages: integer().notNull(),
    language: text(),
    publishers: text(),
    synopsis: text(),
    imageCover: imageUrl("image_cover", "books-covers").notNull(),
    apiId: text().notNull(),
    lockStatus: integer({ mode: "boolean" }),
    lastApiUpdate: text(),
});


export const booksList = sqliteTable("books_list", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer().notNull().references(() => books.id),
    status: text().$type<Status>().notNull(),
    redo: integer().default(0).notNull(),
    actualPage: integer(),
    total: integer().default(0).notNull(),
    comment: text(),
    rating: real(),
    favorite: integer({ mode: "boolean" }),
});


export const booksGenre = sqliteTable("books_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => books.id),
    name: text().notNull(),
});


export const booksAuthors = sqliteTable("books_authors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => books.id),
    name: text().notNull(),
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


export const booksLabels = sqliteTable("books_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer().notNull().references(() => books.id),
    name: text().notNull(),
});


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
