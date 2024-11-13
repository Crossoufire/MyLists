import {cn} from "@/utils/functions";
import {LuCat, LuGamepad2, LuLibrary, LuMonitor, LuPopcorn, LuUser} from "react-icons/lu";


const iconMappings = {
    series: LuMonitor,
    anime: LuCat,
    movies: LuPopcorn,
    games: LuGamepad2,
    books: LuLibrary,
    user: LuUser,
};


export const MediaIcon = ({ mediaType, size, className }) => {
    const IconComponent = iconMappings[mediaType];
    if (!IconComponent) return <img alt="not-found"/>;
    return <IconComponent size={size} className={cn(`text-${mediaType}`, className)}/>;
};
