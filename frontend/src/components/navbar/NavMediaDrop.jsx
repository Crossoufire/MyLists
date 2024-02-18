import {capitalize} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {useUser} from "@/providers/UserProvider";
import {CaretSortIcon} from "@radix-ui/react-icons";
import {NavMediaItem} from "@/components/navbar/NavMediaItem";
import {FaBook, FaFilm, FaGamepad, FaToriiGate, FaTv} from "react-icons/fa";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {useRef} from "react";


export const NavMediaDrop = () => {
    const popRef = useRef();
    const { currentUser } = useUser();

    const menuItems = [
        {url: `/list/series`, media: "series", icon: FaTv},
        {url: `/list/anime`, media: "anime", icon: FaToriiGate, cond: currentUser.add_anime},
        {url: `/list/movies`, media: "movies", icon: FaFilm},
        {url: `/list/books`, media: "books", icon: FaBook, cond: currentUser.add_books},
        {url: `/list/games`, media: "games", icon: FaGamepad, cond: currentUser.add_games}
    ];

    return (
        <>
            <Popover>
                <PopoverTrigger>
                    <Button variant="invisible" className="flex items-center gap-2 text-lg font-semibold px-1">
                        MyLists
                        <CaretSortIcon/>
                    </Button>
                </PopoverTrigger>
                <PopoverClose ref={popRef}/>
                <PopoverContent className="w-[170px] px-2 py-2" align="start">
                    <ul>
                        {menuItems.filter(item => item.cond !== false).map(({icon: Icon, ...item}) =>
                            <NavMediaItem
                                key={item.url}
                                to={`${item.url}/${currentUser.username}`}
                                icon={<Icon size={18} className={`text-${item.media}`}/>}
                                text={`${capitalize(item.media)}List`}
                                popRef={popRef}
                            />
                        )}
                    </ul>
                </PopoverContent>
            </Popover>
        </>
    );
};
