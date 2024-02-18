import {useState} from "react";


export const useLoading = (timeout = 200) => {
    const [isLoading, setLoading] = useState(false);

    const handleLoading = async (asyncFunction, ...args) => {
        let loadingTimer = setTimeout(() => {
            setLoading(true);
        }, timeout);

        const response = await asyncFunction(...args);

        clearTimeout(loadingTimer);
        setLoading(false);

        return response;
    };

    return [isLoading, handleLoading];
};
