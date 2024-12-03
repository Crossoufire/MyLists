import {getApiClient} from "./apiClient";


export class APIError extends Error {
    constructor(status, message, description, errors = undefined) {
        super(message);
        this.name = "APIError";
        this.status = status;
        this.description = description;
        this.errors = errors;
    }
}


export const fetcher = async ({ url, queryOrData, options = {}, method = "get" }) => {
    const response = await getApiClient()[method](url, queryOrData, options);
    if (!response.ok) {
        throw new APIError(
            response.status,
            response.body.message,
            response.body.description,
            response.body?.errors,
        );
    }
    return response.body?.data;
};


export const postFetcher = async ({ url, data, options = {} }) => {
    return await fetcher({ url, queryOrData: data, options, method: "post" });
};
