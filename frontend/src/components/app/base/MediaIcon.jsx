import {cn} from "@/utils/functions.jsx";
import {FaBookOpen, FaFilm, FaGamepad, FaToriiGate, FaTv, FaUser} from "react-icons/fa";


const iconMappings = {
    series: FaTv,
    anime: FaToriiGate,
    movies: FaFilm,
    games: FaGamepad,
    books: FaBookOpen,
    user: FaUser,
};


export const MediaIcon = ({ mediaType, size, className }) => {
    const IconComponent = iconMappings[mediaType];
    if (!IconComponent) return <img alt="not-found"/>;
    return (
        <IconComponent
            size={size}
            className={cn(`text-${mediaType}`, className)}
        />);
};
