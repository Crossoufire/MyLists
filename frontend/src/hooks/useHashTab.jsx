import {useEffect, useState} from "react";


export const useHashTab = (defaultTab) => {
    const [selectedTab, setSelectedTab] = useState(defaultTab ?? "");

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
    }, []);

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
        window.history.pushState(null, "", `#${tab}`);
    };

    return [selectedTab, handleTabChange];
};
