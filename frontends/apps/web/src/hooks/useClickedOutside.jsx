import {useEffect} from "react";


export const useOnClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (ev) => {
            if (!ref.current || ref.current.contains(ev.target)) return;
            handler(ev);
        };

        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);

        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
};
