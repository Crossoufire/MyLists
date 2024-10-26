import {useEffect, useState} from "react";
import {Timeout} from "@tanstack/react-router/dist/cjs/utils";


export const useDebounceCallback = (value: any, delay: number, callback: (...args: any[]) => void, ...args: any[]) => {
    const [timer, setTimer] = useState<Timeout | null>(null);

    useEffect(() => {
        clearTimer();

        if (value && callback) {
            const newTimer = setTimeout(() => {
                callback(...args);
            }, delay);
            setTimer(newTimer);
        }

    }, [value, delay, callback, ...args]);

    const clearTimer = () => {
        if (timer) {
            clearTimeout(timer);
        }
    };
};


export const useDebounce = <T extends any>(value: T, delay: number): [T] => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return [debouncedValue];
};
