import {useState} from "react";
import {MediaType} from "@/utils/types";
import {useAuth} from "@/hooks/AuthHook";
import {Badge} from "@/components/ui/badge";
import {MediaCard} from "@/components/app/MediaCard";
import {LuHeart, LuRefreshCw, LuSettings2} from "react-icons/lu";
import {MediaInfoCorner} from "@/components/app/MediaInfoCorner";
import {QuickAddMedia} from "@/components/media-list/QuickAddMedia";
import {DisplayRating} from "@/components/media-list/DisplayRating";
import {CommentPopover} from "@/components/media-list/CommentPopover";
import {UserMediaEditDialog} from "@/components/media-list/UserMediaEditDialog";
import {SpecificUserMediaData} from "@/components/media-list/SpecificUserMediaData";


interface MediaGridProps {
    allStatus: string;
    isCurrent: boolean;
    mediaType: MediaType;
    queryKey: Array<any>;
    mediaList: Array<any>;
}


export const MediaGrid = ({isCurrent, allStatus, mediaList, queryKey, mediaType}: MediaGridProps) => {
    const {currentUser} = useAuth();

    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:gap-4 lg:grid-cols-5 sm:gap-5">
            {mediaList.map(userMedia =>
                <MediaItem
                    queryKey={queryKey}
                    userMedia={userMedia}
                    isCurrent={isCurrent}
                    mediaType={mediaType}
                    allStatus={allStatus}
                    key={userMedia.media_id}
                    isConnected={!!currentUser}
                />
            )}
        </div>
    );
};


interface MediaItemProps {
    userMedia: any;
    queryKey: string;
    allStatus: string;
    isCurrent: boolean;
    isConnected: boolean;
    mediaType: MediaType;
}


const MediaItem = ({isCurrent, isConnected, allStatus, userMedia, queryKey, mediaType}: MediaItemProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
            <MediaCard media={userMedia} mediaType={mediaType}>
                <div className="absolute top-2 right-2 z-10">
                    {isCurrent &&
                        <div role="button" onClick={() => setDialogOpen(true)}>
                            <LuSettings2 className="opacity-70"/>
                        </div>
                    }
                    {!isCurrent && !userMedia.common && isConnected &&
                        <QuickAddMedia
                            queryKey={queryKey}
                            mediaType={mediaType}
                            allStatus={allStatus}
                            mediaId={userMedia.media_id}
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
                        <h3 className="font-semibold truncate flex-grow" title={userMedia.media_name}>
                            {userMedia.media_name}
                        </h3>
                        <div className="flex-shrink-0">
                            <DisplayRating rating={userMedia.rating}/>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between w-full">
                        <Badge variant="outline" className="flex-shrink-0">{userMedia.status}</Badge>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {userMedia.favorite &&
                                <div className="flex items-center gap-1">
                                    <LuHeart className="text-red-500"/>
                                </div>
                            }
                            {userMedia.comment && <CommentPopover content={userMedia.comment}/>}
                            {userMedia.redo > 0 &&
                                <div className="flex items-center gap-1">
                                    <LuRefreshCw className="w-3.5 h-3.5 text-green-500"/>{userMedia.redo}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </MediaCard>
            {dialogOpen &&
                <UserMediaEditDialog
                    queryKey={queryKey}
                    mediaType={mediaType}
                    userMedia={userMedia}
                    onOpenChange={() => setDialogOpen(false)}
                />
            }
        </>
    );
};



