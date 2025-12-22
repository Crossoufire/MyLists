import {useEffect, useState} from "react";


const MOBILE_BREAKPOINT = 768;


// TODO: To remove when sure that useBreakpoint works great
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }

        mql.addEventListener("change", onChange)
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

        return () => mql.removeEventListener("change", onChange)
    }, [])

    return !!isMobile;
}


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
