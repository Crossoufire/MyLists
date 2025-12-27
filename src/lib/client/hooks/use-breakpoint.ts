import {useEffect, useState} from "react";


const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
};


export function useBreakpoint(key: keyof typeof BREAKPOINTS) {
    const breakpoint = BREAKPOINTS[key];
    const [isBelow, setIsBelow] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        setIsBelow(mql.matches);

        const handler = (ev: MediaQueryListEvent) => {
            setIsBelow(ev.matches);
        }

        mql.addEventListener("change", handler);

        return () => mql.removeEventListener("change", handler);
    }, [breakpoint]);

    return isBelow;
}
