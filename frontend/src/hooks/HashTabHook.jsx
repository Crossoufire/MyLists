import {useEffect, useState} from "react";


export const useHashTab = (defaultTab, storageKey) => {
    const [selectedTab, setSelectedTab] = useState(defaultTab);

    useEffect(() => {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
            const { tab, timestamp } = JSON.parse(storedData);
            const currentTime = new Date().getTime();
            const fiveMinutesInMs = 5 * 60 * 1000;

            if (currentTime - timestamp < fiveMinutesInMs) {
                setSelectedTab(tab);
            }
            else {
                setSelectedTab(defaultTab);
                localStorage.removeItem(storageKey);
            }
        }
    }, [storageKey]);

    const handleTabChange = (newTab) => {
        const storageData = JSON.stringify({
            tab: newTab,
            timestamp: new Date().getTime(),
        });
        setSelectedTab(newTab);
        localStorage.setItem(storageKey, storageData);
    };

    return [selectedTab, handleTabChange];
};
