import {useRef} from "react";
import {ChevronDown} from "lucide-react";
import {useAuth} from "@/lib/hooks/use-auth";
import {capitalize} from "@/lib/utils/functions";
import {MediaType} from "@/lib/server/utils/enums";
import {NavMediaItem} from "@/lib/components/navbar/NavMediaItem";
import {MediaAndUserIcon} from "@/lib/components/media/base/MediaAndUserIcon";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";


export const NavMediaDrop = () => {
    const { currentUser } = useAuth();
    const popRef = useRef<HTMLButtonElement>(null);

    const menuItems = [
        { url: `/list/series`, media: MediaType.SERIES, cond: true },
        { url: `/list/anime`, media: MediaType.ANIME, cond: currentUser?.settings?.find(s => s.mediaType === MediaType.ANIME)?.active },
        { url: `/list/movies`, media: MediaType.MOVIES, cond: true },
        { url: `/list/books`, media: MediaType.BOOKS, cond: currentUser?.settings?.find(s => s.mediaType === MediaType.BOOKS)?.active },
        { url: `/list/games`, media: MediaType.GAMES, cond: currentUser?.settings?.find(s => s.mediaType === MediaType.GAMES)?.active },
        { url: `/list/manga`, media: MediaType.MANGA, cond: currentUser?.settings?.find(s => s.mediaType === MediaType.MANGA)?.active },
    ];

    return (
        <>
            <Popover>
                <PopoverTrigger>
                    <div className="flex items-center gap-2 font-semibold px-1 max-sm:ml-2">
                        MyLists
                        <ChevronDown className="w-3 h-3 opacity-80"/>
                    </div>
                </PopoverTrigger>
                <PopoverClose ref={popRef}/>
                <PopoverContent className="w-full px-2 py-2" align="start">
                    <ul>
                        {menuItems.filter(item => !!item.cond).map(item =>
                            <NavMediaItem
                                key={item.url}
                                popRef={popRef}
                                text={`${capitalize(item.media)}List`}
                                to={`${item.url}/${currentUser?.name}`}
                                icon={<MediaAndUserIcon type={item.media} size={16}/>}
                            />
                        )}
                    </ul>
                </PopoverContent>
            </Popover>
        </>
    );
};
