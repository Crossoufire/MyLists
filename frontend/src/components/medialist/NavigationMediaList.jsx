import {capitalize, cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Tooltip} from "@/components/ui/tooltip";
import {Link, useParams} from "@tanstack/react-router";
import {MediaIcon} from "@/components/app/base/MediaIcon";


export const NavigationMediaList = ({ userData }) => {
    const { mediaType, username } = useParams({ strict: false });

    const menuItems = [
        {url: "/profile", media: "user"},
        {url: `/list/series`, media: "series"},
        {url: `/list/anime`, media: "anime", cond: userData.add_anime},
        {url: `/list/movies`, media: "movies"},
        {url: `/list/books`, media: "books", cond: userData.add_books},
        {url: `/list/games`, media: "games", cond: userData.add_games},
    ];

    return (
        <div className="flex flex-row gap-1">
            {menuItems.filter(item => item.cond !== false).map(item =>
                <Link key={item.url} to={`${item.url}/${username}`}>
                    <Tooltip text={capitalize(item.media)} side="bottom">
                        <Button variant="ghost" size="sm" className={cn("h-10", mediaType === item.media && "bg-secondary/60")}>
                            <MediaIcon mediaType={item.media} size={24}/>
                        </Button>
                    </Tooltip>
                </Link>
            )}
        </div>
    );
};
