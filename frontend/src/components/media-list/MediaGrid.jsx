import {useAuth} from "@/api";
import {useState} from "react";
import {zeroPad} from "@/utils/functions";
import {Badge} from "@/components/ui/badge";
import {MediaCard} from "@/components/app/MediaCard";
import {MediaInfoCorner} from "@/components/app/MediaInfoCorner";
import {Heart, RefreshCw, RotateCw, Settings2} from "lucide-react";
import {QuickAddMedia} from "@/components/media-list/QuickAddMedia";
import {DisplayRating} from "@/components/media-list/DisplayRating";
import {CommentPopover} from "@/components/media-list/CommentPopover";
import {UserMediaEditDialog} from "@/components/media-list/UserMediaEditDialog";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {SpecificUserMediaData} from "@/components/media-list/SpecificUserMediaData";


export const MediaGrid = ({ isCurrent, allStatus, mediaList, queryKey, mediaType }) => {
    const { currentUser } = useAuth();

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


const MediaItem = ({ isCurrent, isConnected, allStatus, userMedia, queryKey, mediaType }) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
            <MediaCard media={userMedia} mediaType={mediaType}>
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


export const RedoSystem = ({ userMedia, mediaType }) => {
    if (mediaType === "games") return null;

    if (["series", "anime"].includes(mediaType)) {
        const totalRedo = userMedia.redo2.reduce((a, b) => a + b, 0);

        if (totalRedo === 0) return null;

        return (
            <Popover>
                <PopoverTrigger>
                    <div className="flex items-center gap-x-2">
                        <RotateCw size={15} className="text-green-500"/>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-40 px-5 pt-3 pb-3 max-h-[210px] overflow-auto" align="center">
                    <div className=" grid gap-3">
                        <div className="space-y-2">
                            {userMedia.redo2.map((season, idx) => (
                                <div key={idx} className="flex gap-3 items-center justify-between">
                                    <div className="text-sm font-medium leading-none">
                                        Season {zeroPad(idx + 1)}
                                    </div>
                                    <div className="text-sm font-medium">
                                        {season}x
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    if (userMedia.redo === 0) return null;

    return (
        <div className="flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 text-green-500"/>{userMedia.redo}
        </div>
    );
};