
export class APIError extends Error {
    constructor(status, message, description, errors = undefined) {
        super(message);
        this.name = "APIError";
        this.status = status;
        this.description = description;
        this.errors = errors;
    }
}
