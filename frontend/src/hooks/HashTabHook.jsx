import {useEffect, useState} from "react";


export const useHashTab = (defaultTab, storageKey) => {
    const [selectedTab, setSelectedTab] = useState(defaultTab);

    useEffect(() => {
        const storedTab = localStorage.getItem(storageKey);
        if (storedTab) {
            setSelectedTab(storedTab);
        }
    }, [storageKey]);

    const handleTabChange = (newTab) => {
        setSelectedTab(newTab);
        localStorage.setItem(storageKey, newTab);
    };

    return [selectedTab, handleTabChange];
};
