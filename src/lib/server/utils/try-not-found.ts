import z from "zod/v4";
import {notFound} from "@tanstack/react-router";
import {FormZodError} from "@/lib/server/utils/error-classes";


export function tryNotFound<T>(callback: () => T): T {
    try {
        return callback();
    }
    catch {
        throw notFound();
    }
}


export function tryFormZodError<T>(callback: () => T): T {
    try {
        return callback();
    }
    catch (error: any) {
        if (error instanceof z.ZodError) {
            throw new FormZodError(error, "Please fix the form errors");
        }
        throw error;
    }
}
