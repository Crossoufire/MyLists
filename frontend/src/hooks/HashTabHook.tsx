import {useEffect, useState} from "react";


export const useHashTab = (defaultTab: string): [string, (tab: string) => void] => {
    const [selectedTab, setSelectedTab] = useState<string>(defaultTab ?? "");

    useEffect(() => {
        const hash = window.location.hash.replace("#", "");
        if (hash) {
            window.history.replaceState(null, "", `#${hash}`);
            setSelectedTab(hash);
        }
        else {
            window.history.replaceState(null, "", `#${defaultTab}`);
        }

        const handleHashChange = () => {
            const newHash = window.location.hash.replace("#", "");
            setSelectedTab(newHash);
        };

        window.addEventListener("hashchange", handleHashChange);

        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [defaultTab]);

    const handleTabChange = (tab: string) => {
        setSelectedTab(tab);
        window.history.pushState(null, "", `#${tab}`);
    };

    return [selectedTab, handleTabChange];
};
