import z from "zod/v4";
import {createMiddleware} from "@tanstack/react-start";
import {sendAdminErrorMail} from "@/lib/server/utils/mail-sender";
import {FormattedError, FormZodError} from "@/lib/server/utils/error-classes";


function createCleanError(originalError: Error, message?: string): Error {
    const cleanError = new Error(message ? message : originalError.message);
    cleanError.name = originalError.name;
    delete cleanError.stack;

    return cleanError;
}


/**
 * Error Types and Logic
 * redirect: thrown in code but returned and handled frontend side by tanstack router.
 * notFound: thrown in code but returned and handled frontend side by tanstack router.
 * FormattedError: Expected Error with pre-formatted message for frontend side.
 * FormattedError(sendMail: true): Error not supposed to happened but pre-formatted message + send mail.
 * FormZodError: Error occurred during Form submission, return the whole error.
 * ZodError: Unexpected Error on validation, send admin email, return generic error message.
 * Error: Unexpected Error anywhere, send admin email, return generic error message.
 **/
export const errorMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    try {
        const results = await next();
        return results;
    }
    catch (err: any) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Error:", err);
        }
        if (err instanceof FormattedError) {
            if (err?.sendMail && process.env.NODE_ENV === "production") {
                await sendAdminErrorMail(err, "A Specific Formatted Error occurred");
            }
            throw createCleanError(err);
        }
        else if (err instanceof FormZodError) {
            throw err;
        }
        else if (err instanceof z.ZodError) {
            if (process.env.NODE_ENV === "production") {
                await sendAdminErrorMail(err, "A Validation error occurred");
            }
            throw createCleanError(err, "A Validation error occurred. Please try again later.");
        }
        else {
            if (process.env.NODE_ENV === "production") {
                await sendAdminErrorMail(err, "An unexpected error occurred");
            }
            throw createCleanError(err, "An Unexpected error occurred. Please try again later.");
        }
    }
});
