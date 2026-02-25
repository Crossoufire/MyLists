import {createMiddleware} from "@tanstack/react-start";
import {withTransaction} from "@/lib/server/database/async-storage";


export const transactionMiddleware = createMiddleware({ type: "function" })
    .server(async ({ next }) => {
        const result = await withTransaction(async (_tx) => {
            return next();
        });

        return result;
    });
