import Database from "bun:sqlite";
import * as schema from "./schema";
import {serverEnv} from "@/env/server";
import * as sqliteVec from "sqlite-vec";
import {MediaType} from "@/lib/utils/enums";
import {drizzle} from "drizzle-orm/bun-sqlite";
import {createServerOnlyFn} from "@tanstack/react-start";


const sqliteDb = new Database(serverEnv.DATABASE_URL, { create: true });

initPragma(sqliteDb);
initSqliteVec(sqliteDb);

const getDbConnection = createServerOnlyFn(() => {
    return drizzle(sqliteDb, { schema, casing: "snake_case" });
});


export const db = getDbConnection();


function initPragma(db: Database) {
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA foreign_keys = ON;");
    db.run("PRAGMA synchronous = NORMAL");
    db.run("PRAGMA checkpoint(FULL)");
    db.run("PRAGMA busy_timeout = 10000");
}


function initSqliteVec(db: Database) {
    sqliteVec.load(db);

    for (const mediaType of Object.values(MediaType)) {
        db.run(`
            CREATE VIRTUAL TABLE IF NOT EXISTS ${mediaType}_vectors
            USING vec0(
                media_id INTEGER PRIMARY KEY,
                embedding FLOAT[1536]
            );
        `);
    }
}
