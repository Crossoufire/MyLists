import {createMiddleware} from "@tanstack/react-start";
import {withTransaction} from "@/lib/server/database/asyncStorage";


// export const transactionMiddleware = createMiddleware().server(async ({ next }) => {
//     try {
//         const result = await db.transaction(async (tx) => {
//             const handlerResult = await dbTransactionLocalStorage.run(tx, async () => {
//                 return await next();
//             });
//             return handlerResult;
//         });
//         return result;
//     }
//     catch (error) {
//         console.error("Transaction failed:", error);
//         throw error;
//     }
// });


export const transactionMiddleware = createMiddleware().server(async ({ next }) => {
        try {
            const result = await withTransaction(async (_tx) => {
                return await next();
            });
            return result;
        }
        catch (error) {
            console.error("Transaction failed:", error);
            throw error;
        }
    },
);