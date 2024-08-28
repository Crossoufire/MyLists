import {toast} from "sonner";
import {useState} from "react";
import {Badge} from "@/components/ui/badge";
import {useLoading} from "@/hooks/LoadingHook";
import {MediaCard} from "@/components/app/MediaCard";
import {useApiUpdater} from "@/hooks/UserUpdaterHook";
import {TopRightCorner} from "@/components/app/TopRightCorner";
import {RedoListDrop} from "@/components/medialist/RedoListDrop";
import {EditMediaList} from "@/components/medialist/EditMediaList";
import {SuppMediaInfo} from "@/components/medialist/SuppMediaInfo";
import {RatingListDrop} from "@/components/medialist/RatingListDrop";
import {CommentPopover} from "@/components/medialist/CommentPopover";
import {Route} from "@/routes/_private/list/$mediaType.$username.jsx";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";


export const MediaGrid = ({ isCurrent, mediaList, onMediaUpdate }) => {
    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:gap-4 lg:grid-cols-5 sm:gap-5">
            {mediaList.map(media =>
                <MediaItem
                    media={media}
                    key={media.media_id}
                    isCurrent={isCurrent}
                    onMediaUpdate={onMediaUpdate}
                />
            )}
        </div>
    );
};


const MediaItem = ({ isCurrent, media }) => {
    const search = Route.useSearch();
    const { mediaType } = Route.useParams();
    const [isLoading, handleLoading] = useLoading();
    const [status, setStatus] = useState(media.status);
    const [isCommon, setIsCommon] = useState(media.common);
    const [isHidden, setIsHidden] = useState(false);
    const updateUserAPI = useApiUpdater(media.media_id, mediaType);

    const handleRemoveMedia = async () => {
        const response = await handleLoading(updateUserAPI.deleteMedia);
        if (response) {
            setIsHidden(true);
            toast.success("Media successfully deleted");
        }
    };

    const handleStatus = async (status) => {
        const response = await handleLoading(updateUserAPI.status, status);
        if (response) {
            if (search.status?.length === 1) {
                setIsHidden(true);
            }
            setStatus(status);
            toast.success(`Media status changed to ${status}`);
        }
    };

    const handleAddOtherList = async (value) => {
        const response = await handleLoading(updateUserAPI.addMedia, value);
        if (response) {
            setIsCommon(true);
            toast.success("Media added to your list");
        }
    };

    if (isHidden) return;

    return (
        <MediaCard media={media} mediaType={mediaType} isLoading={isLoading}>
            <div className="absolute top-2 right-1 z-10">
                {(isCurrent || (!isCurrent && !isCommon)) &&
                    <EditMediaList
                        status={status}
                        isCurrent={isCurrent}
                        handleStatus={handleStatus}
                        allStatus={media.all_status}
                        removeMedia={handleRemoveMedia}
                        addOtherList={handleAddOtherList}
                    />
                }
            </div>
            <div className="absolute top-1.5 left-1.5 z-10 bg-gray-950 px-2 rounded-md opacity-85">
                <SuppMediaInfo
                    media={media}
                    status={status}
                    isCurrent={isCurrent}
                    updateUserAPI={updateUserAPI}
                />
            </div>
            <TopRightCorner
                isCommon={isCommon}
            />
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-2 bg-gray-950 w-full rounded-b-sm">
                <h3 className="font-semibold line-clamp-1" title={media.media_name}>
                    {media.media_name}
                </h3>
                {media.all_status.length !== 1 && <Badge variant="outline">{status}</Badge>}
                <div className="flex items-center justify-between h-[24px]">
                    <ManageFavorite
                        isCurrent={isCurrent}
                        initFav={media.favorite}
                        updateFavorite={updateUserAPI.favorite}
                    />
                    <RatingListDrop
                        isCurrent={isCurrent}
                        initRating={media.rating}
                        updateRating={updateUserAPI.rating}
                    />
                    {(status === "Completed" && mediaType !== "games") &&
                        <RedoListDrop
                            isCurrent={isCurrent}
                            initRedo={media.redo}
                            updateRedo={updateUserAPI.redo}
                        />
                    }
                    <CommentPopover
                        isCurrent={isCurrent}
                        initContent={media.comment}
                        updateComment={updateUserAPI.comment}
                    />
                </div>
            </div>
        </MediaCard>
    );
};
