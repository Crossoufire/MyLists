export class APIError extends Error {
    constructor(status, message, description, errors = undefined) {
        super(message);
        this.status = status;
        this.errors = errors;
        this.name = "APIError";
        this.description = description;
    }
}