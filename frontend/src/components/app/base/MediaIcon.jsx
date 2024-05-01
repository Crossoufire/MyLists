import {cn} from "@/lib/utils";
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
    const IconComp = iconMappings[mediaType];

    if (!IconComp) {
        return <img alt="not-found"/>;
    }

    return (
        <IconComp
            size={size}
            className={cn(`text-${mediaType}`, className)}
        />);
};
