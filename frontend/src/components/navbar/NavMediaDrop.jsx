import {useRef} from "react";
import {useUser} from "@/providers/UserProvider";
import {CaretSortIcon} from "@radix-ui/react-icons";
import {MediaIcon} from "@/components/app/base/MediaIcon";
import {NavMediaItem} from "@/components/navbar/NavMediaItem";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {capitalize} from "@/utils/functions";


export const NavMediaDrop = () => {
    const popRef = useRef();
    const { currentUser } = useUser();

    const menuItems = [
        {url: `/list/series`, media: "series"},
        {url: `/list/anime`, media: "anime", cond: currentUser.settings.anime.active},
        {url: `/list/movies`, media: "movies"},
        {url: `/list/books`, media: "books", cond: currentUser.settings.books.active},
        {url: `/list/games`, media: "games", cond: currentUser.settings.games.active}
    ];

    return (
        <>
            <Popover>
                <PopoverTrigger>
                    <div className="flex items-center gap-2 text-lg font-semibold px-1">
                        MyLists
                        <CaretSortIcon/>
                    </div>
                </PopoverTrigger>
                <PopoverClose ref={popRef}/>
                <PopoverContent className="w-[160px] px-2 py-2" align="start">
                    <ul>
                        {menuItems.filter(item => item.cond !== false).map(item =>
                            <NavMediaItem
                                key={item.url}
                                popRef={popRef}
                                text={`${capitalize(item.media)}List`}
                                to={`${item.url}/${currentUser.username}`}
                                icon={<MediaIcon mediaType={item.media} size={18}/>}
                            />
                        )}
                    </ul>
                </PopoverContent>
            </Popover>
        </>
    );
};
