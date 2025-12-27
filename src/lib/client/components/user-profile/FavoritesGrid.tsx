import {MediaType} from "@/lib/utils/enums";
import {HeartOff, TrendingUp} from "lucide-react";
import {Link, LinkProps} from "@tanstack/react-router";
import {useBreakpoint} from "@/lib/client/hooks/use-breakpoint";
import {BlockLink} from "@/lib/client/components/general/BlockLink";
import {EmptyState} from "@/lib/client/components/user-profile/EmptyState";
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
    const TitleWrapper = linkProps ? Link : "div";
    const favoritesToDisplay = favorites.slice(0, isBelowLg ? 4 : 7);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <TitleWrapper {...linkProps} className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="size-4 text-app-accent"/>
                        {title}
                    </TitleWrapper>
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
                        <BlockLink
                            key={fav.mediaId}
                            search={{ external: false }}
                            to={"/details/$mediaType/$mediaId"}
                            params={{ mediaType: fav.mediaType, mediaId: fav.mediaId }}
                        >
                            <div className="relative group aspect-2/3 rounded-lg overflow-hidden shadow-md">
                                <img
                                    alt={fav.mediaName}
                                    src={fav.mediaCover}
                                    className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-75 duration-300"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-neutral-950/80 via-transparent to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <span className="text-[10px] font-bold text-primary line-clamp-2">
                                        {fav.mediaName}
                                    </span>
                                </div>
                            </div>
                        </BlockLink>
                    )
                }
            </div>
        </Card>
    );
};
