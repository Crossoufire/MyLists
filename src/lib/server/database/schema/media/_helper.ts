import {sql} from "drizzle-orm";
import {user} from "@/lib/server/database/schema";
import {MediaType, Status} from "@/lib/utils/enums";
import {imageUrl} from "@/lib/server/database/custom-types";
import {integer, real, SQLiteColumn, text} from "drizzle-orm/sqlite-core";


export const commonMediaCols = (mediaTypeName: MediaType) => {
    return {
        id: integer("id").primaryKey().notNull(),
        name: text("name").notNull(),
        releaseDate: text("release_date"),
        synopsis: text("synopsis"),
        imageCover: imageUrl("image_cover", `${mediaTypeName}-covers`).notNull(),
        lockStatus: integer({ mode: "boolean" }),
        addedAt: text("added_at").default(sql`(CURRENT_TIMESTAMP)`),
        lastApiUpdate: text("last_api_update"),
    };
};


export const commonMediaListCols = (modelMediaId: SQLiteColumn) => {
    return {
        id: integer("id").primaryKey().notNull(),
        userId: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
        mediaId: integer("media_id").notNull().references(() => modelMediaId),
        status: text("status").$type<Status>().notNull(),
        favorite: integer("favorite", { mode: "boolean" }),
        comment: text("comment"),
        rating: real("rating"),
        addedAt: text("added_at").default(sql`(CURRENT_TIMESTAMP)`),
        lastUpdated: text("last_updated"),
    };
};


export const commonGenericCols = (modelMediaId: SQLiteColumn) => {
    return {
        id: integer().primaryKey().notNull(),
        mediaId: integer().notNull().references(() => modelMediaId),
        name: text("name").notNull(),
    };
};


export const commonMediaTagsCols = (modelMediaId: SQLiteColumn) => {
    return {
        id: integer().primaryKey().notNull(),
        userId: integer().notNull().references(() => user.id, { onDelete: "cascade" }),
        mediaId: integer().references(() => modelMediaId),
        name: text("name").notNull(),
    };
};


export const commMediaEpsCols = (modelMediaId: SQLiteColumn) => {
    return {
        id: integer().primaryKey().notNull(),
        mediaId: integer().notNull().references(() => modelMediaId),
        season: integer().notNull(),
        episodes: integer().notNull(),
    };
};
