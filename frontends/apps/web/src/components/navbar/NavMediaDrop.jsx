import {useRef} from "react";
import {ChevronDown} from "lucide-react";
import {useAuth} from "@mylists/api/src";
import {capitalize} from "@/utils/functions";
import {MediaIcon} from "@/components/app/MediaIcon";
import {NavMediaItem} from "@/components/navbar/NavMediaItem";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const NavMediaDrop = () => {
    const popRef = useRef();
    const { currentUser } = useAuth();

    const menuItems = [
        { url: `/list/series`, media: "series" },
        { url: `/list/anime`, media: "anime", cond: currentUser.settings.find(s => s.media_type === "anime").active },
        { url: `/list/movies`, media: "movies" },
        { url: `/list/books`, media: "books", cond: currentUser.settings.find(s => s.media_type === "books").active },
        { url: `/list/games`, media: "games", cond: currentUser.settings.find(s => s.media_type === "games").active },
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
