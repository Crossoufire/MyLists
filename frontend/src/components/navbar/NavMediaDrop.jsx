import {useRef} from "react";
import {capitalize} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {useUser} from "@/providers/UserProvider";
import {CaretSortIcon} from "@radix-ui/react-icons";
import {MediaIcon} from "@/components/primitives/MediaIcon";
import {NavMediaItem} from "@/components/navbar/NavMediaItem";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const NavMediaDrop = () => {
    const popRef = useRef();
    const { currentUser } = useUser();

    const menuItems = [
        {url: `/list/series`, media: "series"},
        {url: `/list/anime`, media: "anime", cond: currentUser.add_anime},
        {url: `/list/movies`, media: "movies"},
        {url: `/list/books`, media: "books", cond: currentUser.add_books},
        {url: `/list/games`, media: "games", cond: currentUser.add_games}
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
                <PopoverContent className="w-[160px] px-2 py-2" align="start">
                    <ul>
                        {menuItems.filter(item => item.cond !== false).map(item =>
                            <NavMediaItem
                                key={item.url}
                                to={`${item.url}/${currentUser.username}`}
                                icon={<MediaIcon mediaType={item.media} size={18}/>}
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
