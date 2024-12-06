import {useLayoutEffect, useState} from "react";


export function useMediaQuery(query, { defaultValue = false, initializeWithValue = true } = {}) {
    const [matches, setMatches] = useState(() => {
        if (initializeWithValue) return getMatches(query);
        return defaultValue;
    });

    function getMatches(query) {
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
