import {db} from "@/lib/server/database/db";
import {AsyncLocalStorage} from "node:async_hooks";
import {LibSQLTransaction} from "drizzle-orm/libsql";
import * as schema from "@/lib/server/database/schema";
import {ExtractTablesWithRelations} from "drizzle-orm";


export type TransactionClient = LibSQLTransaction<typeof schema, ExtractTablesWithRelations<typeof schema>>;

export const dbTransactionLocalStorage = new AsyncLocalStorage<TransactionClient>();


export const getDbClient = () => {
    const transactionalClient = dbTransactionLocalStorage.getStore();
    return transactionalClient || db;
};


export async function withTransaction<T>(action: (tx: TransactionClient) => Promise<T>) {
    const result = await db.transaction(async (tx) => {
        const handlerResult = await dbTransactionLocalStorage.run(tx, async () => await action(tx));
        return handlerResult;
    });

    return result;
}