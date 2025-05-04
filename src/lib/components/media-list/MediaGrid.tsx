import {useState} from "react";
import {useAuth} from "@/lib/hooks/use-auth";
import {Heart, Settings2} from "lucide-react";
import {Badge} from "@/lib/components/ui/badge";
import {MediaCard} from "@/lib/components/app/MediaCard";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {RedoSystem} from "@/lib/components/media-list/RedoSystem";
import {MediaInfoCorner} from "@/lib/components/app/MediaInfoCorner";
import {QuickAddMedia} from "@/lib/components/media-list/QuickAddMedia";
import {DisplayRating} from "@/lib/components/media-list/DisplayRating";
import {CommentPopover} from "@/lib/components/media-list/CommentPopover";
import {mediaListOptions} from "@/lib/react-query/query-options/query-options";
import {UserMediaEditDialog} from "@/lib/components/media-list/UserMediaEditDialog";
import {SpecificUserMediaData} from "@/lib/components/media-list/SpecificUserMediaData";


interface MediaGridProps {
    queryKey: string[];
    isCurrent: boolean;
    mediaType: MediaType;
    items: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaListOptions>["queryFn"]>>>["results"]["items"];
}


export const MediaGrid = ({ isCurrent, items, queryKey, mediaType }: MediaGridProps) => {
    const { currentUser } = useAuth();
    const allStatuses = Status.byMediaType(mediaType);

    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:gap-4 lg:grid-cols-5 sm:gap-5">
            {items.map((userMedia: any) =>
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
    userMedia: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaListOptions>["queryFn"]>>>["results"]["items"][0];
}


const MediaItem = ({ isCurrent, isConnected, allStatuses, userMedia, queryKey, mediaType }: MediaItemProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

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
                    <SpecificUserMediaData
                        userMedia={userMedia}
                        mediaType={mediaType}
                    />
                </div>
                {isConnected && <MediaInfoCorner isCommon={userMedia.common}/>}
                <div className="absolute bottom-0 px-3 pt-2 pb-3 space-y-3 bg-gray-900 w-full rounded-b-sm">
                    <div className="flex items-center justify-between space-x-2 w-full max-sm:text-sm">
                        <h3 className="font-semibold truncate flex-grow" title={userMedia.mediaName}>
                            {userMedia.mediaName}
                        </h3>
                        <div className="flex-shrink-0">
                            <DisplayRating
                                rating={userMedia.rating}
                                ratingSystem={userMedia.ratingSystem}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between w-full">
                        <Badge variant="outline" className="flex-shrink-0">{userMedia.status}</Badge>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {userMedia.favorite &&
                                <div className="flex items-center gap-1">
                                    <Heart className="w-4 h-4 text-red-500"/>
                                </div>
                            }
                            {userMedia.comment && <CommentPopover content={userMedia.comment}/>}
                            <RedoSystem
                                userMedia={userMedia}
                                mediaType={mediaType}
                            />
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


