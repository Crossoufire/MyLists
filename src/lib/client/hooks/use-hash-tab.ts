import {useEffect, useState} from "react";


export const useHashTab = <T>(defaultTab: T) => {
    const [selectedTab, setSelectedTab] = useState(defaultTab ?? "");

    useEffect(() => {
        const hash = decodeURIComponent(window.location.hash.replace("#", ""));
        if (hash) {
            window.history.replaceState(null, "", `#${encodeURIComponent(hash)}`);
            setSelectedTab(hash);
        }
        else {
            window.history.replaceState(null, "", `#${encodeURIComponent(String(defaultTab))}`);
        }

        const handleHashChange = () => {
            const newHash = decodeURIComponent(window.location.hash.replace("#", ""));
            setSelectedTab(newHash);
        };

        window.addEventListener("hashchange", handleHashChange);

        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [defaultTab]);

    const handleTabChange = (tab: string) => {
        setSelectedTab(tab);
        window.history.pushState(null, "", `#${encodeURIComponent(tab)}`);
    };

    return [selectedTab, handleTabChange] as [string, (tab: string) => void];
};
