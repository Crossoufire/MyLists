import {useRef} from "react";
import {useAuth} from "@mylists/api/src";
import {capitalize} from "@/utils/functions";
import {CaretSortIcon} from "@radix-ui/react-icons";
import {MediaIcon} from "@/components/app/MediaIcon";
import {NavMediaItem} from "@/components/navbar/NavMediaItem";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const NavMediaDrop = () => {
    const popRef = useRef();
    const { currentUser } = useAuth();

    const menuItems = [
        { url: `/list/series`, media: "series" },
        { url: `/list/anime`, media: "anime", cond: currentUser.settings.anime.active },
        { url: `/list/movies`, media: "movies" },
        { url: `/list/books`, media: "books", cond: currentUser.settings.books.active },
        { url: `/list/games`, media: "games", cond: currentUser.settings.games.active }
    ];

    return (
        <>
            <Popover>
                <PopoverTrigger>
                    <div className="flex items-center gap-2 font-semibold px-1 max-sm:ml-2">
                        MyLists
                        <CaretSortIcon className="opacity-80"/>
                    </div>
                </PopoverTrigger>
                <PopoverClose ref={popRef}/>
                <PopoverContent className="w-full px-2 py-2" align="start">
                    <ul>
                        {menuItems.filter(item => item.cond !== false).map(item =>
                            <NavMediaItem
                                key={item.url}
                                popRef={popRef}
                                text={`${capitalize(item.media)}List`}
                                to={`${item.url}/${currentUser.username}`}
                                icon={<MediaIcon mediaType={item.media} size={16}/>}
                            />
                        )}
                    </ul>
                </PopoverContent>
            </Popover>
        </>
    );
};
