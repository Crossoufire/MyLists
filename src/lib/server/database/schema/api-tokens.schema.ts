import {ApiProviderType} from "@/lib/utils/enums";
import {integer, sqliteTable, text, uniqueIndex} from "drizzle-orm/sqlite-core";


export const apiTokens = sqliteTable("api_tokens", {
    id: integer("id").primaryKey().notNull(),
    provider: text("provider").$type<ApiProviderType>().notNull(),
    accessToken: text("access_token").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
}, (table) => [
    uniqueIndex("api_tokens_provider_unique").on(table.provider),
]);
