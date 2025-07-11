import {useEffect, useState} from "react";


export const useDebounceCallback = <T>(value: unknown, delay: number, callback: (args: T) => void, args: T) => {
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        clearTimer();

        if (value && callback) {
            const newTimer = setTimeout(() => callback(args), delay);
            setTimer(newTimer);
        }

        return () => clearTimer();
    }, [value]);

    const clearTimer = () => {
        if (timer) {
            clearTimeout(timer);
            setTimer(null);
        }
    };
};


export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};
