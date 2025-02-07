import {useEffect, useState} from "react";


export const useDebounceCallback = (value, delay, callback, ...args) => {
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        clearTimer();

        if (value && callback) {
            const newTimer = setTimeout(() => {
                callback(...args);
            }, delay);
            setTimer(newTimer);
        }
    }, [value]);

    const clearTimer = () => {
        if (timer) {
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
