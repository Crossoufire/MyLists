import {sql} from "drizzle-orm";
import {user} from "./auth.schema";
import {relations} from "drizzle-orm/relations";
import {MediaType, SocialNotifType} from "@/lib/utils/enums";
import {integer, sqliteTable, text, uniqueIndex} from "drizzle-orm/sqlite-core";


export const socialNotifications = sqliteTable("social_notifications", {
    id: integer().primaryKey().notNull(),
    actorId: integer("actor_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    type: text().$type<SocialNotifType>().notNull(),
    read: integer({ mode: "boolean" }).default(false).notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
}, (table) => [
    uniqueIndex("social_notif_unique").on(table.userId, table.actorId, table.type),
]);


export const mediaNotifications = sqliteTable("media_notifications", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    mediaId: integer("media_id").notNull(),
    mediaType: text("media_type").$type<MediaType>().notNull(),
    season: integer("season"),
    episode: integer("episode"),
    isSeasonFinale: integer({ mode: "boolean" }),
    releaseDate: text("release_date"),
    read: integer({ mode: "boolean" }).default(false).notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});


export const socialNotificationsRelations = relations(socialNotifications, ({ one }) => ({
    actor: one(user, {
        fields: [socialNotifications.actorId],
        references: [user.id],
    }),
    recipient: one(user, {
        fields: [socialNotifications.userId],
        references: [user.id],
    }),
}));
