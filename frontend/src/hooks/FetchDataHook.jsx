import {api} from "@/api/MyApiClient";


export const fetcher = async (url, query, options) => {
    const delay = options?.delay || 0;
    await new Promise(resolve => setTimeout(resolve, delay * 1000));

    const response = await api.get(url, query, options);

    if (!response.ok) {
        throw new Error(
            JSON.stringify({
                status: response.status,
                message: response.body.message,
                description: response.body.description,
            })
        );
    }

    return response.body.data;
};
