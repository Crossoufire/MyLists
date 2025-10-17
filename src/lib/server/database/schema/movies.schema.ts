import {Status} from "@/lib/utils/enums";
import {imageUrl} from "@/lib/server/database/custom-types";
import {user} from "@/lib/server/database/schema/auth.schema";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {relations} from "drizzle-orm/relations";


export const movies = sqliteTable("movies", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    originalName: text(),
    releaseDate: text(),
    homepage: text(),
    duration: integer().notNull(),
    originalLanguage: text(),
    synopsis: text(),
    voteAverage: real(),
    voteCount: real(),
    popularity: real(),
    budget: real(),
    revenue: real(),
    tagline: text(),
    imageCover: imageUrl("image_cover", "movies-covers").notNull(),
    apiId: integer().notNull(),
    collectionId: integer(),
    directorName: text(),
    compositorName: text(),
    lockStatus: integer({ mode: "boolean" }),
    lastApiUpdate: text(),
});


export const moviesList = sqliteTable("movies_list", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer().notNull().references(() => movies.id),
    status: text().$type<Status>().notNull(),
    redo: integer().default(0).notNull(),
    comment: text(),
    total: integer().default(0).notNull(),
    rating: real(),
    favorite: integer({ mode: "boolean" }),
});


export const moviesGenre = sqliteTable("movies_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => movies.id),
    name: text().notNull(),
});


export const moviesActors = sqliteTable("movies_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => movies.id),
    name: text().notNull(),
});


export const moviesRelations = relations(movies, ({ many }) => ({
    moviesGenres: many(moviesGenre),
    moviesLabels: many(moviesLabels),
    moviesLists: many(moviesList),
    moviesActors: many(moviesActors),
}));


export const moviesListRelations = relations(moviesList, ({ one }) => ({
    movie: one(movies, {
        fields: [moviesList.mediaId],
        references: [movies.id]
    }),
    user: one(user, {
        fields: [moviesList.userId],
        references: [user.id]
    }),
}));


export const moviesGenreRelations = relations(moviesGenre, ({ one }) => ({
    movie: one(movies, {
        fields: [moviesGenre.mediaId],
        references: [movies.id]
    }),
}));


export const moviesActorsRelations = relations(moviesActors, ({ one }) => ({
    movie: one(movies, {
        fields: [moviesActors.mediaId],
        references: [movies.id]
    }),
}));


export const moviesLabels = sqliteTable("movies_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
    mediaId: integer().notNull().references(() => movies.id),
    name: text().notNull(),
});


export const moviesLabelsRelations = relations(moviesLabels, ({ one }) => ({
    user: one(user, {
        fields: [moviesLabels.userId],
        references: [user.id]
    }),
    movie: one(movies, {
        fields: [moviesLabels.mediaId],
        references: [movies.id]
    }),
}));
