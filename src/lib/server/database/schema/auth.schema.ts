import {imageUrl} from "@/lib/server/database/custom-types";
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {ApiProviderType, PrivacyType, RatingSystemType, RoleType} from "@/lib/server/utils/enums";


export const user = sqliteTable("user", {
    id: integer("id").$type<number>().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    lastNotifReadTime: text("last_notif_read_time"),
    profileViews: integer("profile_views").default(0).notNull(),
    role: text("role").$type<RoleType>().default(RoleType.USER).notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
    privacy: text("privacy").$type<PrivacyType>().default(PrivacyType.RESTRICTED).notNull(),
    gridListView: integer("grid_list_view", { mode: "boolean" }).default(true).notNull(),
    image: imageUrl("image", "profile-covers").default("default.jpg").notNull(),
    showUpdateModal: integer("show_update_modal", { mode: "boolean" }).default(true).notNull(),
    ratingSystem: text("rating_system").$type<RatingSystemType>().default(RatingSystemType.SCORE).notNull(),
    searchSelector: text("search_selector").$type<ApiProviderType>().default(ApiProviderType.TMDB).notNull(),
    backgroundImage: imageUrl("background_image", "profile-back-covers").default("default.jpg").notNull(),
});


export const session = sqliteTable("session", {
    id: integer("id").$type<number>().primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" })
});


export const account = sqliteTable("account", {
    id: integer("id").$type<number>().primaryKey(),
    accountId: integer("account_id"),
    providerId: text("provider_id"),
    userId: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});


export const verification = sqliteTable("verification", {
    id: integer("id").$type<number>().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" })
});
