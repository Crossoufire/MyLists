import {useEffect, useState} from "react";


export const useHashTab = <T extends string>(defaultTab: T) => {
    const [selectedTab, setSelectedTab] = useState(defaultTab);

    useEffect(() => {
        const hash = decodeURIComponent(window.location.hash.replace("#", ""));
        if (hash) {
            window.history.replaceState(null, "", `#${encodeURIComponent(hash)}`);
            setSelectedTab(hash as T);
        }
        else {
            window.history.replaceState(null, "", `#${encodeURIComponent(String(defaultTab))}`);
        }

        const handleHashChange = () => {
            const newHash = decodeURIComponent(window.location.hash.replace("#", ""));
            setSelectedTab(newHash as T);
        };

        window.addEventListener("hashchange", handleHashChange);

        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [defaultTab]);

    const handleTabChange = (tab: T) => {
        setSelectedTab(tab);
        window.history.pushState(null, "", `#${encodeURIComponent(tab)}`);
    };

    return [selectedTab, handleTabChange] as [T, (tab: T) => void];
};
