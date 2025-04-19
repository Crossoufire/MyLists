import {db} from "@/lib/server/database/db";
// import type {ResultSet} from "@libsql/client";
import {AsyncLocalStorage} from "node:async_hooks";
import * as schema from "@/lib/server/database/schema";
import {ExtractTablesWithRelations} from "drizzle-orm";
import {BetterSQLiteTransaction} from "drizzle-orm/better-sqlite3";


type SchemaType = typeof schema;
type TransactionClient = BetterSQLiteTransaction<SchemaType, ExtractTablesWithRelations<SchemaType>>;

export const dbTransactionLocalStorage = new AsyncLocalStorage<TransactionClient>();


export const getDbClient = () => {
    const transactionalClient = dbTransactionLocalStorage.getStore();
    return transactionalClient || db;
}
