import useSWR from "swr";
import {useEffect, useState} from "react";
import {useApi} from "@/providers/ApiProvider";


const useFetchData2 = (url, query, options) => {
    const api = useApi();
    const [error, setError] = useState();
    const [apiData, setApiData] = useState();
    const [loading, setLoading] = useState(true);

    const fetchAPI = async () => {
        setLoading(true);
        setError(undefined);

        const response = await api.get(url, query, options);

        if (!response.ok) {
            setLoading(false);

            const error = {
                message: response.body.message,
                status: response.status,
                description: response.body.description
            };

            // noinspection JSCheckFunctionSignatures
            setError(error);
        } else {
            setLoading(false);
            setApiData(response.body.data);
        }
    };

    useEffect(() => {
        void fetchAPI();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, url, JSON.stringify(query)]);

    return { apiData, loading, error };
};


const useFetchData = (url, query, options) => {
    const api = useApi();

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


export { useFetchData, useFetchData2 };