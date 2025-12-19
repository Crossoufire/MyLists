import {MediaType} from "@/lib/utils/enums";
import {getMediaColor} from "@/lib/utils/functions";
import {BookImage, Cat, Gamepad2, Library, Monitor, PanelsTopLeft, Popcorn, User} from "lucide-react";


const ICONS_MAP = {
    user: User,
    overview: PanelsTopLeft,
    series: Monitor,
    anime: Cat,
    movies: Popcorn,
    games: Gamepad2,
    books: Library,
    manga: BookImage,
} as const;


interface MediaIconProps {
    size?: number;
    className?: string;
    type: MediaType | "user" | "overview";
}


export const MediaAndUserIcon = ({ type, size, className }: MediaIconProps) => {
    const IconComp = ICONS_MAP[type];
    if (!IconComp) return null;

    return (
        <IconComp
            size={size ?? 18}
            className={className}
            style={{ color: getMediaColor(type) }}
        />
    );
};
