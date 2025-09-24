import {useLayoutEffect, useState} from "react";


interface Options {
    defaultValue?: boolean;
    initializeWithValue?: boolean;
}


export function useMediaQuery(query: string, { defaultValue = false, initializeWithValue = true }: Options = {}) {
    const [matches, setMatches] = useState<boolean>(() => {
        if (initializeWithValue) return getMatches(query);
        return defaultValue;
    });

    function getMatches(query: string): boolean {
        return window.matchMedia(query).matches;
    }

    useLayoutEffect(() => {
        function handleChange() {
            setMatches(getMatches(query));
        }

        const matchMedia = window.matchMedia(query);
        handleChange();
        matchMedia.addEventListener("change", handleChange);
        return () => matchMedia.removeEventListener("change", handleChange);
    }, [query]);

    return matches;
}
