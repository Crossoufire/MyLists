import {APIError} from "./apiError";
import {getApiClient} from "./apiClient";


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
