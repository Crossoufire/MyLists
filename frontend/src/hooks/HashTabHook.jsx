import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "@tanstack/react-router";


export const useHashTab = (defaultTab) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState(defaultTab);

    useEffect(() => {
        if (location.hash === "") return;
        setSelectedTab(location.hash.replace("#", ""));
    }, [location.hash, defaultTab]);

    const handleTabChange = (value) => {
        setSelectedTab(value);
        // noinspection JSCheckFunctionSignatures
        void navigate( { hash: value });
    };

    return [selectedTab, handleTabChange];
};
