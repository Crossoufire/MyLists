import z from "zod/v4";


export class FormattedError extends Error {
    public readonly sendMail: boolean | undefined;

    constructor(message: string, sendMail?: boolean) {
        super(message);
        this.name = "FormattedError";
        this.sendMail = sendMail;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FormattedError);
        }
    }
}


export class FormZodError extends Error {
    public readonly issues: any[];

    constructor(zodError: z.ZodError, message?: string) {
        super(message || "Form validation failed");
        this.name = "FormZodError";
        this.issues = zodError.issues;
    }
}
