import {db} from "@/lib/server/database/db";
import {AsyncLocalStorage} from "node:async_hooks";
import {LibSQLTransaction} from "drizzle-orm/libsql";
import * as schema from "@/lib/server/database/schema";
import {ExtractTablesWithRelations} from "drizzle-orm";


type SchemaType = typeof schema;
export type TransactionClient = LibSQLTransaction<SchemaType, ExtractTablesWithRelations<SchemaType>>;

export const dbTransactionLocalStorage = new AsyncLocalStorage<TransactionClient>();


export const getDbClient = () => {
    const transactionalClient = dbTransactionLocalStorage.getStore();
    return transactionalClient || db;
};


export async function withTransaction<T>(action: (tx: TransactionClient) => Promise<T>) {
    try {
        const result = await db.transaction(async (tx) => {
            const handlerResult = await dbTransactionLocalStorage.run(tx, () => action(tx));
            return handlerResult;
        });

        return result;
    }
    catch (error) {
        throw error;
    }
}