import {relations} from "drizzle-orm/relations";
import {MediaType} from "@/lib/utils/enums";
import {user} from "@/lib/server/database/schema/auth.schema";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {communGenericCols, communMediaCols, communMediaLabelsCols, communMediaListCols} from "@/lib/server/database/schema/media/_helper";


export const movies = sqliteTable("movies", {
    originalName: text(),
    homepage: text(),
    duration: integer().notNull(),
    originalLanguage: text(),
    voteAverage: real(),
    voteCount: real(),
    popularity: real(),
    budget: real(),
    revenue: real(),
    tagline: text(),
    apiId: integer().notNull(),
    collectionId: integer(),
    directorName: text(),
    compositorName: text(),
    ...communMediaCols(MediaType.MOVIES),
});


export const moviesList = sqliteTable("movies_list", {
    redo: integer().default(0).notNull(),
    total: integer("total").default(0).notNull(),
    ...communMediaListCols(movies.id),
});


export const moviesGenre = sqliteTable("movies_genre", {
    ...communGenericCols(movies.id),
});


export const moviesActors = sqliteTable("movies_actors", {
    ...communGenericCols(movies.id),
});


export const moviesLabels = sqliteTable("movies_labels", {
    ...communMediaLabelsCols(movies.id),
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
