import {relations} from "drizzle-orm/relations";
import {user} from "@/lib/server/database/schema/auth.schema";
import {customJson} from "@/lib/server/database/custom-types";
import {AchievementDifficulty, MediaType} from "@/lib/utils/enums";
import {integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core";


export const achievement = sqliteTable("achievement", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    codeName: text().notNull(),
    description: text().notNull(),
    mediaType: text().$type<MediaType>().notNull(),
    value: text(),
});


export const achievementTier = sqliteTable("achievement_tier", {
    id: integer().primaryKey().notNull(),
    achievementId: integer().notNull().references(() => achievement.id),
    difficulty: text().$type<AchievementDifficulty>().notNull(),
    criteria: customJson<{ count: number }>("criteria").notNull(),
    rarity: real(),
});


export const userAchievement = sqliteTable("user_achievement", {
    id: integer().primaryKey().notNull(),
    userId: integer().references(() => user.id, { onDelete: "cascade" }),
    achievementId: integer().references(() => achievement.id),
    tierId: integer().references(() => achievementTier.id),
    progress: real(),
    count: real(),
    completed: integer({ mode: "boolean" }),
    completedAt: text(),
    lastCalculatedAt: text(),
});


export const achievementRelations = relations(achievement, ({ many }) => ({
    achievementTiers: many(achievementTier),
    userAchievements: many(userAchievement),
}));


export const achievementTierRelations = relations(achievementTier, ({ one, many }) => ({
    achievement: one(achievement, {
        fields: [achievementTier.achievementId],
        references: [achievement.id]
    }),
    userAchievements: many(userAchievement),
}));


export const userAchievementRelations = relations(userAchievement, ({ one }) => ({
    achievementTier: one(achievementTier, {
        fields: [userAchievement.tierId],
        references: [achievementTier.id]
    }),
    achievement: one(achievement, {
        fields: [userAchievement.achievementId],
        references: [achievement.id]
    }),
    user: one(user, {
        fields: [userAchievement.userId],
        references: [user.id]
    }),
}));
