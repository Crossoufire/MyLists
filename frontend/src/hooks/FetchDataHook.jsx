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

            const error = new Error("An error occurred while fetching the data.");
            error.message = response.body.message;
            error.status = response.status;
            error.description = response.body.description;

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
        const response = await api.get(url, query, options);

        if (!response.ok) {
            const error = new Error("An error occurred while fetching the data.");

            error.status = response.status;
            error.message = response.body.message;
            error.description = response.body.description;

            throw error;
        }

        return response.body.data;
    }

    const { data, isLoading, error, mutate } = useSWR([url, query, options], fetcher);

    return { apiData: data, loading: isLoading, error, mutate };
};


export { useFetchData, useFetchData2 };