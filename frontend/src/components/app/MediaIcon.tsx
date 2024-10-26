import React from "react";
import {cn} from "@/utils/functions";
import type {IconType} from "react-icons";
import {LuCat, LuGamepad2, LuLibrary, LuMonitor, LuPopcorn, LuUser} from "react-icons/lu";


interface MediaIconProps {
    size?: number;
    mediaType: string;
    className?: string;
}


const iconMappings: Record<string, IconType> = {
    series: LuMonitor,
    anime: LuCat,
    movies: LuPopcorn,
    games: LuGamepad2,
    books: LuLibrary,
    user: LuUser,
};


export const MediaIcon = ({mediaType, size, className}: MediaIconProps) => {
    const IconComponent = iconMappings[mediaType];

    if (!IconComponent) {
        return <img alt="not-found"/>;
    }

    return <IconComponent size={size} className={cn(`text-${mediaType}`, className)}/>;
};
