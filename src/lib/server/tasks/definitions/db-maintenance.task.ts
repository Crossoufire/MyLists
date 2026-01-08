import {z} from "zod";
import {defineTask} from "@/lib/server/tasks/define-task";
import {getDbClient} from "@/lib/server/database/async-storage";


export const dbMaintenanceTask = defineTask({
    name: "db-maintenance" as const,
    visibility: "admin",
    description: "WAL checkpoint, Vacuum, and Analyze on the db",
    inputSchema: z.object({}),
    handler: async (ctx) => {
        const db = getDbClient();

        await ctx.step("run-pragmas", async () => {
            await db.run("PRAGMA synchronous = NORMAL");
            await db.run("PRAGMA checkpoint(FULL)");
        });

        await ctx.step("vacuum", async () => {
            await db.run("VACUUM");
        });

        await ctx.step("analyze", async () => {
            await db.run("ANALYZE");
        });

        await ctx.step("collect-settings", async () => {
            const pragmas = ["journal_mode", "synchronous", "wal_autocheckpoint", "locking_mode"];
            for (const name of pragmas) {
                const result = await db.get(`PRAGMA ${name};`);
                ctx.metric(`sqlite.${name}`, result ? Object.values(result)[0] : "unknown");
            }
        });
    },
});
