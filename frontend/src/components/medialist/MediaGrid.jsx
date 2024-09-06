import {Badge} from "@/components/ui/badge";
import {MediaCard} from "@/components/app/MediaCard";
import {CommonCorner} from "@/components/app/base/CommonCorner";
import {RedoListDrop} from "@/components/medialist/RedoListDrop";
import {Route} from "@/routes/_private/list/$mediaType.$username";
import {EditMediaList} from "@/components/medialist/EditMediaList";
import {SuppMediaInfo} from "@/components/medialist/SuppMediaInfo";
import {RatingListDrop} from "@/components/medialist/RatingListDrop";
import {CommentPopover} from "@/components/medialist/CommentPopover";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";
import {useAddMediaToUserList, useRemoveMediaFromList, useUpdateUserMediaList} from "@/utils/mutations";
import {DotsVerticalIcon} from "@radix-ui/react-icons";


export const MediaGrid = ({ isCurrent, mediaList }) => {
    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:gap-4 lg:grid-cols-5 sm:gap-5">
            {mediaList.map(media =>
                <MediaItem
                    media={media}
                    key={media.media_id}
                    isCurrent={isCurrent}
                />
            )}
        </div>
    );
};


const MediaItem = ({ isCurrent, media }) => {
    const mediaId = media.media_id;
    const search = Route.useSearch();
    const {username, mediaType} = Route.useParams();

    const handleRemoveMedia = () => {
        removeMediaFromList.mutate();
    };
    const handleStatus = (status) => {
        updateStatus.mutate({ payload: status });
    };
    const handleAddOtherList = (status) => {
        addOtherList.mutate({ payload: status });
    };
    const onStatusChange = (oldData, variables) => {
        const newData = { ...oldData };
        const status = variables.payload;
        const searchStatuses = search?.status;

        if (searchStatuses) {
            if (!searchStatuses.includes(status)) {
                newData.media_data = newData.media_data.filter(m => m.media_id !== media.media_id);
                return newData;
            }
        }

        if (status === "Completed" && (mediaType === "series" || mediaType === "anime")) {
            newData.media_data = newData.media_data.map(m => {
                if (m.media_id === media.media_id) {
                    return {
                        ...m,
                        current_season: media.eps_per_season.length,
                        last_episode_watched: media.eps_per_season[media.eps_per_season.length - 1],
                    };
                }
                return m;
            });
        }
        if (status === "Completed" && mediaType === "books") {
            newData.media_data = newData.media_data.map(m => {
                if (m.media_id === media.media_id) {
                    return { ...m, actual_page: media.total_pages };
                }
                return m;
            });
        }
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === media.media_id) {
                return { ...m, status: status, redo: 0 };
            }
            return m;
        });
        return newData;
    };
    const onFavoriteChange = (oldData, variables) => {
        const newData = { ...oldData };
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === media.media_id) {
                return { ...m, favorite: variables.payload };
            }
            return m;
        });
        return newData;
    };
    const onRatingChange = (oldData, variables) => {
        const newData = { ...oldData };
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === media.media_id) {
                return { ...m, rating: { ...newData.rating, value: variables.payload } };
            }
            return m;
        });
        return newData;
    };
    const onRedoChange = (oldData, variables) => {
        const newData = { ...oldData };
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === media.media_id) {
                return { ...m, redo: variables.payload };
            }
            return m;
        });
        return newData;
    };
    const onCommentChange = (oldData, variables) => {
        const newData = { ...oldData };
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === media.media_id) {
                return { ...m, comment: variables.payload };
            }
            return m;
        });
        return newData;
    };

    const addOtherList = useAddMediaToUserList(mediaType, mediaId, username, search);
    const removeMediaFromList = useRemoveMediaFromList(mediaType, mediaId, username, search);
    const updateRedo = useUpdateUserMediaList("update_redo", mediaType, mediaId, username, search, onRedoChange);
    const updateRating = useUpdateUserMediaList("update_rating", mediaType, mediaId, username, search, onRatingChange);
    const updateStatus = useUpdateUserMediaList("update_status", mediaType, mediaId, username, search, onStatusChange);
    const updateComment = useUpdateUserMediaList("update_comment", mediaType, mediaId, username, search, onCommentChange);
    const updateFavorite = useUpdateUserMediaList("update_favorite", mediaType, mediaId, username, search, onFavoriteChange);

    const cardPending = addOtherList.isPending || updateStatus.isPending || removeMediaFromList.isPending;

    return (
        <MediaCard media={media} mediaType={mediaType} isPending={cardPending}>
            <div className="absolute top-2 right-1 z-10">
                {(isCurrent || (!isCurrent && !media.common)) &&
                    <EditMediaList
                        status={media.status}
                        isCurrent={isCurrent}
                        updateStatus={handleStatus}
                        allStatus={media.all_status}
                        removeMedia={handleRemoveMedia}
                        addOtherList={handleAddOtherList}
                    >
                        <DotsVerticalIcon className="h-5 w-5 hover:opacity-70"/>
                    </EditMediaList>
                }
            </div>
            <div className="absolute top-1.5 left-1.5 z-10 bg-gray-950 px-2 rounded-md opacity-85">
                <SuppMediaInfo
                    media={media}
                    isCurrent={isCurrent}
                />
            </div>
            <CommonCorner isCommon={media.common}/>
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-2 bg-gray-900 w-full rounded-b-sm">
                <h3 className="font-semibold line-clamp-1" title={media.media_name}>
                    {media.media_name}
                </h3>
                <Badge variant="outline">{media.status}</Badge>
                <div className="flex items-center justify-between h-[24px]">
                    <ManageFavorite
                        isCurrent={isCurrent}
                        isFavorite={media.favorite}
                        updateFavorite={updateFavorite}
                    />
                    <RatingListDrop
                        rating={media.rating}
                        isCurrent={isCurrent}
                        updateRating={updateRating}
                    />
                    {(media.status === "Completed" && mediaType !== "games") &&
                        <RedoListDrop
                            redo={media.redo}
                            isCurrent={isCurrent}
                            updateRedo={updateRedo}
                        />
                    }
                    <CommentPopover
                        isCurrent={isCurrent}
                        content={media.comment}
                        updateComment={updateComment}
                    />
                </div>
            </div>
        </MediaCard>
    );
};
