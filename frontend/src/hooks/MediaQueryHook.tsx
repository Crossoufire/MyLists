import {useLayoutEffect, useState} from "react";


interface UseMediaQueryOptions {
    defaultValue?: boolean;
    initializeWithValue?: boolean;
}


export function useMediaQuery(query: string, options: UseMediaQueryOptions = {}): boolean {
    const {defaultValue = false, initializeWithValue = true} = options;

    const [matches, setMatches] = useState<boolean>(() => {
        if (initializeWithValue) return getMatches(query);
        return defaultValue;
    });

    function getMatches(query: string) {
        return window.matchMedia(query).matches;
    }

    function handleChange() {
        setMatches(getMatches(query));
    }

    useLayoutEffect(() => {
        const matchMedia = window.matchMedia(query);
        handleChange();
        matchMedia.addEventListener("change", handleChange);
        return () => matchMedia.removeEventListener("change", handleChange);
    }, [query]);

    return matches;
}
