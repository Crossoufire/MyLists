import z from "zod";
import {createSerializationAdapter} from "@tanstack/react-router";


export class FormattedError extends Error {
    public readonly sendMail: boolean | undefined;

    constructor(message: string, sendMail?: boolean) {
        super(message);
        this.sendMail = sendMail;
        this.name = "FormattedError";

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FormattedError);
        }
    };
};


export const formattedErrorAdapter = createSerializationAdapter({
    key: "formatted-error",
    test: (v) => v instanceof FormattedError,
    toSerializable: ({ message }) => ({ message }),
    fromSerializable: ({ message }) => new FormattedError(message),
});


export class FormZodError extends Error {
    public readonly issues: any[];

    constructor(zodError: z.ZodError, message?: string) {
        super(message || "Form validation failed");
        this.name = "FormZodError";
        this.issues = zodError.issues;
    };
};


export const formZodErrorAdapter = createSerializationAdapter({
    key: "form-zod-error",
    test: (v) => v instanceof FormZodError,
    toSerializable: ({ message, issues }) => ({ message, issues }),
    fromSerializable: ({ message, issues }) => new FormZodError({ issues } as z.ZodError, message),
});


export class CancelJobError extends Error {
    constructor(message?: string) {
        super(message || "Job was cancelled.");
        this.name = "CancellationError";
    }
}
