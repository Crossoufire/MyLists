import dotenv from "dotenv";
import * as schema from "./schema";
import {drizzle} from "drizzle-orm/libsql";
import {createClient} from "@libsql/client";


dotenv.config();


const client = createClient({ url: process.env.DATABASE_URL as string });


export const db = drizzle({ client, schema, casing: "snake_case" });
