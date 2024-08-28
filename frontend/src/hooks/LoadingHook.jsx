import {useState} from "react";


export const useMutation = (timeout = 200) => {
    const [isPending, setIsPending] = useState(false);

    const mutate = async (asyncFunction, ...args) => {
        let loadingTimer = setTimeout(() => {
            setIsPending(true);
        }, timeout);

        let response = false;
        try {
            response = await asyncFunction(...args);
        }
        finally {
            clearTimeout(loadingTimer);
            setIsPending(false);
        }

        return response;
    };

    return [isPending, mutate];
};
