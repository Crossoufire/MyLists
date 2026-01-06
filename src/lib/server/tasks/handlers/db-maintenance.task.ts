import {z} from "zod";
import {defineTask} from "@/lib/server/tasks/define-task";
import {getDbClient} from "@/lib/server/database/async-storage";


export const dbMaintenanceTask = defineTask({
    meta: {
        visibility: "admin",
        description: "WAL checkpoint, Vacuum, and Analyze on the db",
    },
    inputSchema: z.object({}),
    handler: async (ctx) => {
        const db = getDbClient();
        ctx.logger.info("Starting: dbMaintenance execution.");

        await db.run("PRAGMA synchronous = NORMAL");
        await db.run("PRAGMA checkpoint(FULL)");
        await db.run("VACUUM");
        await db.run("ANALYZE");

        const pragmaValues: Record<string, any> = {};
        const pragmas = ["journal_mode", "synchronous", "wal_autocheckpoint", "locking_mode"];

        for (const name of pragmas) {
            const result = await db.get(`PRAGMA ${name};`);
            pragmaValues[name] = result ? Object.values(result)[0] : null;
        }
        ctx.logger.info({ json: pragmaValues }, "Current SQLite settings");

        ctx.logger.info("Completed: dbMaintenance execution.");
    },
});
