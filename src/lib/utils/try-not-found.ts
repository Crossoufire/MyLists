import z from "zod";
import {notFound} from "@tanstack/react-router";
import {FormZodError} from "@/lib/utils/error-classes";


export function tryNotFound<T>(callback: () => T): T {
    try {
        return callback();
    }
    catch {
        throw notFound();
    }
}


export function tryFormZodError<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
        return schema.parse(data);
    }
    catch (err: unknown) {
        if (err instanceof z.ZodError) {
            throw new FormZodError(err);
        }
        throw err;
    }
}
