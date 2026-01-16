import {relations} from "drizzle-orm/relations";
import {MediaType} from "@/lib/utils/enums";
import {user} from "@/lib/server/database/schema/auth.schema";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {commonGenericCols, commonMediaCollectionsCols, commonMediaCols, commonMediaListCols} from "@/lib/server/database/schema/media/_helper";


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
    apiId: integer().unique().notNull(),
    collectionId: integer(),
    directorName: text(),
    compositorName: text(),
    ...commonMediaCols(MediaType.MOVIES),
});


export const moviesList = sqliteTable("movies_list", {
    redo: integer().default(0).notNull(),
    total: integer("total").default(0).notNull(),
    ...commonMediaListCols(movies.id),
});


export const moviesGenre = sqliteTable("movies_genre", {
    ...commonGenericCols(movies.id),
});


export const moviesActors = sqliteTable("movies_actors", {
    ...commonGenericCols(movies.id),
});


export const moviesCollections = sqliteTable("movies_collections", {
    ...commonMediaCollectionsCols(movies.id),
});


export const moviesRelations = relations(movies, ({ many }) => ({
    moviesGenres: many(moviesGenre),
    moviesCollections: many(moviesCollections),
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


export const moviesCollectionsRelations = relations(moviesCollections, ({ one }) => ({
    user: one(user, {
        fields: [moviesCollections.userId],
        references: [user.id]
    }),
    movie: one(movies, {
        fields: [moviesCollections.mediaId],
        references: [movies.id]
    }),
}));
