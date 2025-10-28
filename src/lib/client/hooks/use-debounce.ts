import {useEffect, useRef, useState} from "react";


export const useDebounceCallback = (value: unknown, delay: number, callback: () => void) => {
    const callbackRef = useRef(callback);
    const timerRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (value !== undefined && value !== null && value !== "") {
            timerRef.current = setTimeout(() => {
                callbackRef.current();
            }, delay);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [value, delay]);
};


export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};
