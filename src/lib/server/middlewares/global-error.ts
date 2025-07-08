import {createMiddleware} from "@tanstack/react-start";


// TODO: This could be the idea of a global error middleware. (`notFound` are not thrown but returned and handled frontend side)
export const errorMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    try {
        const results = await next();
        return results;
    }
    catch (err: any) {
        // if (err instanceof FormattedError || err instanceof FormZodError) {
        //     throw err;
        // }
        // else if (err instanceof z.ZodError) {
        //     await sendErrorMailToAdmin();
        //     throw new Error("A Validation error occurred");
        // }
        // else {
        //     await sendErrorMailToAdmin();
        //     throw new Error("An Unexpected error occurred. Please try again later.");
        // }
        throw new Error("An Unexpected error occurred. Please try again later.");
    }
});
