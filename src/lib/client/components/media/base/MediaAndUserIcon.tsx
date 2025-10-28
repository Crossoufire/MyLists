import {MediaType} from "@/lib/utils/enums";
import {getMediaColor} from "@/lib/utils/functions";
import {BookImage, Cat, Gamepad2, Library, Monitor, Popcorn, User} from "lucide-react";


interface MediaIconProps {
    size?: number;
    className?: string;
    type: MediaType | "user";
}


const getMediaAndUserIcon = (type: MediaType | "user") => {
    const icons = {
        user: User,
        series: Monitor,
        anime: Cat,
        movies: Popcorn,
        games: Gamepad2,
        books: Library,
        manga: BookImage,
    };
    return icons[type];
};


export const MediaAndUserIcon = ({ type, size, className }: MediaIconProps) => {
    const IconComp = getMediaAndUserIcon(type);
    if (!IconComp) return null;

    return (
        <IconComp
            size={size ?? 18}
            className={className}
            style={{ color: getMediaColor(type) }}
        />
    );
};
