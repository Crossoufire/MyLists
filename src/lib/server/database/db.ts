import * as schema from "./schema";
import {serverEnv} from "@/env/server";
import {drizzle} from "drizzle-orm/libsql";
import {createClient} from "@libsql/client";
import {createServerOnlyFn} from "@tanstack/react-start";


const client = createClient({ url: serverEnv.DATABASE_URL });


const getDbConnection = createServerOnlyFn(() => drizzle({ client, schema, casing: "snake_case" }));


export const db = getDbConnection();
