import {useEffect, useState} from "react";


export const useDebounceCallback = (value, delay, callback, ...args) => {
    const [timer, setTimer] = useState(null);

    useEffect(() => {
        clearTimer();

        if (value && callback) {
            const newTimer = setTimeout(() => {
                callback(...args);
            }, delay);
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

export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return [debouncedValue];
};
