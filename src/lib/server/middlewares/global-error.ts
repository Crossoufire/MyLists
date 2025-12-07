import z from "zod";
import {isRedirect} from "@tanstack/react-router";
import {createMiddleware} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError, FormZodError} from "@/lib/utils/error-classes";


/**
 * Error Types and Logic
 * redirect: thrown in code but returned and handled frontend side by tanstack router.
 * notFound: thrown in code but returned and handled frontend side by tanstack router.
 * FormattedError: Expected Error with pre-formatted message for frontend side.
 * FormZodError: Error occurred during Form submission, return the whole error.
 * ZodError: Unexpected Error on validation, send admin email, return generic error message.
 * Error: Unexpected Error anywhere, send admin email, return generic error message.
 **/
export const errorMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    try {
        const results = await next();
        if ("error" in results && isRedirect(results.error)) {
            throw results.error;
        }

        return results;
    }
    catch (err: any) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Error:", { err });
        }

        if ("options" in err && isRedirect(err)) {
            throw err;
        }

        await saveError(err);

        if (err instanceof FormattedError || err instanceof FormZodError) {
            throw err;
        }
        else if (err instanceof z.ZodError) {
            throw new Error("A Validation error occurred. Please try again later.");
        }
        else {
            throw new Error("An Unexpected error occurred. Please try again later.");
        }
    }
});


const saveError = async (err: any) => {
    const adminService = await getContainer().then((c) => c.services.admin);

    await adminService.saveErrorToDb({
        name: err?.name,
        stack: err?.stack,
        message: err?.message,
    });
}
