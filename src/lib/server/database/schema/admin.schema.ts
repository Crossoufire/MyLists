import {sql} from "drizzle-orm";
import {relations} from "drizzle-orm/relations";
import {LogTask} from "@/lib/types/tasks.types";
import {user} from "@/lib/server/database/schema/auth.schema";
import {index, integer, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {customJson, dateAsString} from "@/lib/server/database/custom-types";


export const errorLogs = sqliteTable("error_logs", {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    stack: text("stack"),
    name: text("name").notNull(),
    message: text("message").notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});


export const taskHistory = sqliteTable("task_history", {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    taskId: text("task_id").notNull(),
    userId: integer("user_id").references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    errorMessage: text("error_message"),
    taskName: text("task_name").notNull(),
    triggeredBy: text("triggered_by").notNull(),
    logs: customJson<LogTask[]>("logs").notNull(),
    startedAt: dateAsString("started_at").notNull(),
    finishedAt: dateAsString("finished_at").notNull(),
}, (table) => [
    index("ix_task_history_task_id").on(table.taskId),
    index("ix_task_history_status").on(table.status),
    index("ix_task_history_user_id").on(table.userId),
]);


export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
    user: one(user, {
        fields: [taskHistory.userId],
        references: [user.id]
    }),
}));
