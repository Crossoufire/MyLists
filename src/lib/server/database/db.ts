import Database from "bun:sqlite";
import * as schema from "./schema";
import {serverEnv} from "@/env/server";
import * as sqliteVec from "sqlite-vec";
import {drizzle} from "drizzle-orm/bun-sqlite";
import {createServerOnlyFn} from "@tanstack/react-start";


const sqlite = new Database(serverEnv.DATABASE_URL, { create: true });
sqliteVec.load(sqlite);


const getDbConnection = createServerOnlyFn(() => {
    return drizzle(sqlite, { schema, casing: "snake_case" });
});


export const db = getDbConnection();


export {sqlite};
