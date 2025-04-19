import dotenv from "dotenv";
import * as schema from "./schema";
import Database from "better-sqlite3";
// import {drizzle} from "drizzle-orm/libsql";
import {drizzle} from 'drizzle-orm/better-sqlite3';


dotenv.config();


// const client = createClient({ url: process.env.DATABASE_URL as string });
const sqlite = new Database("./instance/site.db");


// export const db = drizzle({ client, schema, casing: "snake_case" });
export const db = drizzle({ client: sqlite, schema, casing: "snake_case" });
