import z from "zod";
import {notFound} from "@tanstack/react-router";
import {FormZodError} from "@/lib/utils/error-classes";


export const tryNotFound = <T extends z.ZodType>(schema: T) => (data: unknown): z.infer<T> => {
    try {
        return schema.parse(data);
    }
    catch {
        throw notFound();
    }
};


export const tryFormZodError = <T extends z.ZodType>(schema: T) => (data: unknown): z.infer<T> => {
    try {
        if (data instanceof FormData) {
            return schema.parse(Object.fromEntries(data.entries()));
        }
        return schema.parse(data);
    }
    catch (err: unknown) {
        if (err instanceof z.ZodError) {
            throw new FormZodError(err);
        }
        throw err;
    }
};
