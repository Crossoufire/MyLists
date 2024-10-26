export class APIError extends Error {
    status: number;
    description: string;
    errors?: Record<string, any> | undefined;

    constructor(status: number, message: string, description: string, errors: Record<string, any> | undefined = undefined) {
        super(message);
        this.name = "APIError";
        this.status = status;
        this.description = description;
        this.errors = errors;
    }
}
