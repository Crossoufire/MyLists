import {Link} from "react-router-dom";
import {capitalize, cn} from "@/lib/utils";
import {Tooltip} from "@/components/ui/tooltip";
import {FaBook, FaFilm, FaGamepad, FaToriiGate, FaTv, FaUser} from "react-icons/fa";


export const NavigationMedia = ({ userData, mediaType }) => {
    const menuItems = [
        {url: "/profile", media: "user", icon: FaUser},
        {url: `/list/series`, media: "series", icon: FaTv},
        {url: `/list/anime`, media: "anime", icon: FaToriiGate, cond: userData.add_anime},
        {url: `/list/movies`, media: "movies", icon: FaFilm},
        {url: `/list/books`, media: "books", icon: FaBook, cond: userData.add_books},
        {url: `/list/games`, media: "games", icon: FaGamepad, cond: userData.add_games}
    ];

    return (
        <div className="flex flex-row gap-5">
            {menuItems.filter(item => item.cond !== false).map(({ icon: Icon, ...item }) =>
                <Link key={item.url} to={`${item.url}/${userData.username}`}>
                    <Tooltip text={capitalize(item.media)} side="bottom">
                        <div className={cn(`text-${item.media}`, mediaType === item.media && "rounded-sm border-neutral-500 border-b-4 pb-2")}>
                            {<Icon size={25}/>}
                        </div>
                    </Tooltip>
                </Link>
            )}
        </div>
    );
};
