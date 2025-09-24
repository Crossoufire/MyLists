import {useState} from "react";
import {Settings2} from "lucide-react";
import {Badge} from "@/lib/client/components/ui/badge";
import {UserMediaItem} from "@/lib/types/query.options.types";
import {MediaType, Status} from "@/lib/utils/enums";
import {MediaCard} from "@/lib/client/components/media/base/MediaCard";
import {QuickAddMedia} from "@/lib/client/components/media/base/QuickAddMedia";
import {DisplayRating} from "@/lib/client/components/media/base/DisplayRating";
import {queryKeys} from "@/lib/client/react-query/query-options/query-options";
import {DisplayComment} from "@/lib/client/components/media/base/DisplayComment";
import {DisplayFavorite} from "@/lib/client/components/media/base/DisplayFavorite";
import {MediaCornerCommon} from "@/lib/client/components/media/base/MediaCornerCommon";
import {UserMediaEditDialog} from "@/lib/client/components/media/base/UserMediaEditDialog";


interface BaseMediaListItemProps {
    isCurrent: boolean;
    isConnected: boolean;
    mediaType: MediaType;
    allStatuses: Status[];
    rating: React.ReactNode;
    userMedia: UserMediaItem;
    redoDisplay?: React.ReactNode;
    mediaDetailsDisplay?: React.ReactNode;
    queryKey: ReturnType<typeof queryKeys.userListKey>;
}


export const BaseMediaListItem = (props: BaseMediaListItemProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { isCurrent, queryKey, isConnected, mediaType, allStatuses, rating, userMedia, redoDisplay, mediaDetailsDisplay } = props;

    return (
        <>
            <MediaCard item={userMedia} mediaType={mediaType}>
                <div className="absolute right-2 top-2 z-10">
                    {isCurrent &&
                        <div role="button" onClick={() => setDialogOpen(true)}>
                            <Settings2 className="size-4 opacity-70"/>
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
                <div className="absolute left-1.5 top-1.5 z-10 rounded-md bg-gray-950 px-2 opacity-85">
                    {mediaDetailsDisplay}
                </div>
                {isConnected &&
                    <MediaCornerCommon
                        isCommon={userMedia.common}
                    />
                }
                <div className="absolute bottom-0 w-full space-y-3 rounded-b-sm bg-gray-900 px-3 pb-3 pt-2">
                    <div className="flex w-full items-center justify-between space-x-2 max-sm:text-sm">
                        <h3 className="flex-grow truncate font-semibold" title={userMedia.mediaName}>
                            {userMedia.mediaName}
                        </h3>
                        <div className="flex-shrink-0">
                            {rating &&
                                <DisplayRating rating={rating}/>
                            }
                        </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-between">
                        <Badge variant="outline" className="flex-shrink-0">
                            {userMedia.status}
                        </Badge>
                        <div className="flex flex-shrink-0 items-center gap-2">
                            {userMedia.favorite &&
                                <DisplayFavorite isFavorite={userMedia.favorite}/>
                            }
                            {userMedia.comment &&
                                <DisplayComment content={userMedia.comment}/>
                            }
                            {redoDisplay}
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