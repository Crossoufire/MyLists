import {cn} from "@/utils/functions";
import {BookA, Cat, Gamepad2, Library, Monitor, Popcorn, User} from "lucide-react";


const iconMappings = {
    series: Monitor,
    anime: Cat,
    movies: Popcorn,
    games: Gamepad2,
    books: Library,
    manga: BookA,
    user: User,
};


export const MediaIcon = ({ mediaType, size, className }) => {
    const IconComponent = iconMappings[mediaType];
    if (!IconComponent) return <img alt="not-found"/>;
    return <IconComponent size={size} className={cn(`text-${mediaType}`, className)}/>;
};
