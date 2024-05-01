import {useEffect, useState} from "react";


export const useDebounce = (value, timeout, callback, ...args) => {
    const [timer, setTimer] = useState(null);

    useEffect(() => {
        clearTimer();

        if (value && callback) {
            const newTimer = setTimeout(() => {
                callback(...args);
            }, timeout);
            setTimer(newTimer);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const clearTimer = () => {
        if (timer) {
            // noinspection JSCheckFunctionSignatures
            clearTimeout(timer);
        }
    };
};
