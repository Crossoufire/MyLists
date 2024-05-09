import useSWR from "swr";
import {toast} from "sonner";
import {api} from "@/api/MyApiClient";


const useFetchData = (url, query, options) => {
    const fetcher = async () => {
        const delay = options?.delay || 0;
        await new Promise(resolve => setTimeout(resolve, delay * 1000));

        const response = await api.get(url, query, options);

        if (!response.ok) {
            throw {
                status: response.status,
                message: response.body.message,
                description: response.body.description,
            };
        }

        return response.body.data;
    };

    const { data, isLoading, error, mutate } = useSWR([url, query, options], fetcher);

    return { apiData: data, loading: isLoading, error, mutate };
};


export const fetcher = async (url, query, options) => {
    const delay = options?.delay || 0;
    await new Promise(resolve => setTimeout(resolve, delay * 1000));

    const response = await api.get(url, query, options);

    if (!response.ok) {
        toast.error(response.body.description);
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


export { useFetchData };


