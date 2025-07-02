import {useState} from "react";
import {Settings2} from "lucide-react";
import {useAuth} from "@/lib/hooks/use-auth";
import {Badge} from "@/lib/components/ui/badge";
import {ListUserMedia} from "@/lib/components/types";
import {formatRating} from "@/lib/utils/functions";
import {mediaConfig} from "@/lib/components/media-config";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {MediaCard} from "@/lib/components/media/base/MediaCard";
import {DisplayRating} from "@/lib/components/media/base/DisplayRating";
import {DisplayComment} from "@/lib/components/media/base/DisplayComment";
import {DisplayFavorite} from "@/lib/components/media/base/DisplayFavorite";
import {QuickAddMedia} from "@/lib/components/media-list/QuickAddMedia";
import {MediaCornerCommon} from "@/lib/components/media/base/MediaCornerCommon";
import {UserMediaEditDialog} from "@/lib/components/media-list/UserMediaEditDialog";


interface MediaGridProps {
    queryKey: string[];
    isCurrent: boolean;
    mediaType: MediaType;
    items: ListUserMedia[];
}


export const MediaGrid = ({ isCurrent, items, queryKey, mediaType }: MediaGridProps) => {
    const { currentUser } = useAuth();
    const allStatuses = Status.byMediaType(mediaType);

    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:gap-4 lg:grid-cols-5 sm:gap-5">
            {items.map((userMedia) =>
                <MediaItem
                    queryKey={queryKey}
                    userMedia={userMedia}
                    isCurrent={isCurrent}
                    mediaType={mediaType}
                    key={userMedia.mediaId}
                    allStatuses={allStatuses}
                    isConnected={!!currentUser}
                />
            )}
        </div>
    );
};


interface MediaItemProps {
    isCurrent: boolean;
    queryKey: string[];
    isConnected: boolean;
    mediaType: MediaType;
    allStatuses: Status[];
    userMedia: ListUserMedia;
}


const MediaItem = ({ isCurrent, isConnected, allStatuses, userMedia, queryKey, mediaType }: MediaItemProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const rating = formatRating(userMedia.ratingSystem, userMedia.rating);
    const [RedoComponent, DetailsComponent] = mediaConfig[mediaType].listDetailsCards;

    return (
        <>
            <MediaCard item={userMedia} mediaType={mediaType}>
                <div className="absolute top-2 right-2 z-10">
                    {isCurrent &&
                        <div role="button" onClick={() => setDialogOpen(true)}>
                            <Settings2 className="w-4 h-4 opacity-70"/>
                        </div>
                    }
                    {!isCurrent && !userMedia.common && isConnected &&
                        <QuickAddMedia
                            queryKey={queryKey}
                            mediaType={mediaType}
                            allStatuses={allStatuses}
                            mediaId={userMedia.mediaId}
                        />
                    }
                </div>
                <div className="absolute top-1.5 left-1.5 z-10 bg-gray-950 px-2 rounded-md opacity-85">
                    {DetailsComponent ?
                        //@ts-expect-error
                        <DetailsComponent userMedia={userMedia as any}/> : null
                    }
                </div>
                {isConnected && <MediaCornerCommon isCommon={userMedia.common}/>}
                <div className="absolute bottom-0 px-3 pt-2 pb-3 space-y-3 bg-gray-900 w-full rounded-b-sm">
                    <div className="flex items-center justify-between space-x-2 w-full max-sm:text-sm">
                        <h3 className="font-semibold truncate flex-grow" title={userMedia.mediaName}>
                            {userMedia.mediaName}
                        </h3>
                        <div className="flex-shrink-0">
                            <DisplayRating rating={rating}/>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between w-full">
                        <Badge variant="outline" className="flex-shrink-0">
                            {userMedia.status}
                        </Badge>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {userMedia.favorite &&
                                <DisplayFavorite isFavorite={userMedia.favorite}/>
                            }
                            {userMedia.comment &&
                                <DisplayComment content={userMedia.comment}/>
                            }
                            {RedoComponent ?
                                //@ts-expect-error
                                <RedoComponent userMedia={userMedia as any}/> : null
                            }
                        </div>
                    </div>
                </div>
            </MediaCard>
            <UserMediaEditDialog
                queryKey={queryKey}
                mediaType={mediaType}
                userMedia={userMedia}
                dialogOpen={dialogOpen}
                onOpenChange={() => setDialogOpen(false)}
            />
        </>
    );
};
