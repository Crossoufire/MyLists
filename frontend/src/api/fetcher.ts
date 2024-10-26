import {api} from "@/api/apiClient";
import {APIError} from "@/api/apiError";


interface FetcherParams {
    url: string;
    queryOrData?: Record<string, any>;
    options?: Record<string, any>;
    method?: "get" | "post" | "put" | "delete" | "patch";
}


interface PostFetcherParams {
    url: string;
    data?: Record<string, any>;
    options?: Record<string, any>;
}


export const fetcher = async ({url, queryOrData, options = {}, method = "get"}: FetcherParams): Promise<any> => {
    const response = await api[method](url, queryOrData, options);
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


export const postFetcher = async ({url, data, options = {}}: PostFetcherParams): Promise<any> => {
    return await fetcher({url, queryOrData: data, options, method: "post"});
};
