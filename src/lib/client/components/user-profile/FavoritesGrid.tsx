import {MediaType} from "@/lib/utils/enums";
import {HeartOff, TrendingUp} from "lucide-react";
import {Link, LinkProps} from "@tanstack/react-router";
import {useBreakpoint} from "@/lib/client/hooks/use-breakpoint";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {MediaCard} from "@/lib/client/components/media/base/MediaCard";
import {Card, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


interface FavoritesGridProps {
    title: string;
    linkProps?: LinkProps;
    favorites: {
        mediaId: number;
        mediaName: string;
        mediaCover: string;
        mediaType: MediaType;
    }[];
}


export const MediaFavoritesGrid = ({ favorites, title, linkProps }: FavoritesGridProps) => {
    const isBelowLg = useBreakpoint("lg");
    const favoritesToDisplay = favorites.slice(0, isBelowLg ? 4 : 7);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {linkProps ?
                        <Link {...linkProps} className="text-sm text-primary font-semibold flex items-center gap-2 hover:text-app-accent">
                            <TrendingUp className="size-4 text-app-accent"/>
                            {title}
                        </Link>
                        :
                        <div className="text-sm text-primary font-semibold flex items-center gap-2">
                            <TrendingUp className="size-4 text-app-accent"/>
                            {title}
                        </div>
                    }
                </CardTitle>
            </CardHeader>
            <div className="grid grid-cols-7 gap-2 -mt-1 max-lg:grid-cols-4">
                {favorites.length === 0 ?
                    <EmptyState
                        icon={HeartOff}
                        className="col-span-7"
                        message="No favorites added yet."
                    />
                    :
                    favoritesToDisplay.map((fav) =>
                        <MediaCard key={`${fav.mediaId}-${fav.mediaType}`} item={fav} mediaType={fav.mediaType}>
                            <div className="absolute bottom-0 w-full rounded-b-sm p-3 pb-2">
                                <h3 className="text-[10px] font-bold text-primary line-clamp-2" title={fav.mediaName}>
                                    {fav.mediaName}
                                </h3>
                            </div>
                        </MediaCard>
                    )
                }
            </div>
        </Card>
    );
};
