import {useAuth} from "@/hooks/AuthHook";
import {Badge} from "@/components/ui/badge";
import {MediaCard} from "@/components/app/MediaCard";
import {DotsVerticalIcon} from "@radix-ui/react-icons";
import {RedoListDrop} from "@/components/medialist/RedoListDrop";
import {RatingComponent} from "@/components/app/RatingComponent";
import {userMediaMutations} from "@/api/mutations/mediaMutations";
import {EditMediaList} from "@/components/medialist/EditMediaList";
import {SuppMediaInfo} from "@/components/medialist/SuppMediaInfo";
import {CommentPopover} from "@/components/medialist/CommentPopover";
import {MediaInfoCorner} from "@/components/app/base/MediaInfoCorner";
import {Route} from "@/routes/_private/list/$mediaType/$username/route";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";


export const MediaGrid = ({ isCurrent, mediaList }) => {
    const search = Route.useSearch();
    const { currentUser } = useAuth();
    const { username, mediaType } = Route.useParams();

    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:gap-4 lg:grid-cols-5 sm:gap-5">
            {mediaList.map(userMedia =>
                <MediaItem
                    search={search}
                    userMedia={userMedia}
                    isCurrent={isCurrent}
                    key={userMedia.media_id}
                    isConnected={!!currentUser}
                    queryKey={["userList", mediaType, username, search]}
                />
            )}
        </div>
    );
};


const MediaItem = ({ isCurrent, isConnected, userMedia, search, queryKey }) => {
    const { mediaType } = Route.useParams();
    const mediaMutations = userMediaMutations(mediaType, userMedia.media_id, queryKey);

    const onStatusSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        const status = variables.payload;
        const searchStatuses = search?.status;

        if (searchStatuses) {
            if (!searchStatuses.includes(status)) {
                newData.media_data = newData.media_data.filter(m => m.media_id !== userMedia.media_id);
                return newData;
            }
        }
        if (status === "Completed" && (mediaType === "series" || mediaType === "anime")) {
            newData.media_data = newData.media_data.map(m => {
                if (m.media_id === userMedia.media_id) {
                    return {
                        ...m,
                        current_season: userMedia.eps_per_season.length,
                        last_episode_watched: userMedia.eps_per_season[userMedia.eps_per_season.length - 1],
                    };
                }
                return m;
            });
        }
        if (status === "Completed" && mediaType === "books") {
            newData.media_data = newData.media_data.map(m => {
                if (m.media_id === userMedia.media_id) {
                    return { ...m, actual_page: userMedia.total_pages };
                }
                return m;
            });
        }

        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === userMedia.media_id) {
                return { ...m, status: status, redo: 0 };
            }
            return m;
        });

        return newData;
    };

    const updateStatus = mediaMutations.updateStatusFunc(onStatusSuccess);
    const cardPending = (updateStatus.isPending || mediaMutations.addToList.isPending || mediaMutations.removeFromList.isPending);

    return (
        <MediaCard media={userMedia} mediaType={mediaType} isPending={cardPending}>
            <div className="absolute top-2 right-1 z-10">
                {(isCurrent || ((!isCurrent && isConnected) && !userMedia.common)) &&
                    <EditMediaList
                        isCurrent={isCurrent}
                        status={userMedia.status}
                        updateStatus={updateStatus}
                        allStatus={userMedia.all_status}
                        addOtherList={mediaMutations.addToList}
                        removeMedia={mediaMutations.removeFromList}
                    >
                        <DotsVerticalIcon className="h-5 w-5 hover:opacity-70"/>
                    </EditMediaList>
                }
            </div>
            <div className="absolute top-1.5 left-1.5 z-10 bg-gray-950 px-2 rounded-md opacity-85">
                <SuppMediaInfo
                    queryKey={queryKey}
                    userMedia={userMedia}
                    isCurrent={isCurrent}
                />
            </div>
            {isConnected && <MediaInfoCorner isCommon={userMedia.common}/>}
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-2 bg-gray-900 w-full rounded-b-sm">
                <h3 className="font-semibold line-clamp-1" title={userMedia.media_name}>
                    {userMedia.media_name}
                </h3>
                <Badge variant="outline">{userMedia.status}</Badge>
                <div className="flex items-center justify-between h-[24px]">
                    <ManageFavorite
                        isCurrent={isCurrent}
                        isFavorite={userMedia.favorite}
                        updateFavorite={mediaMutations.updateFavorite}
                    />
                    <RatingComponent
                        inline={true}
                        isEditable={isCurrent}
                        rating={userMedia.rating}
                        onUpdate={mediaMutations.updateRating}
                    />
                    {(userMedia.status === "Completed" && mediaType !== "games") &&
                        <RedoListDrop
                            redo={userMedia.redo}
                            isCurrent={isCurrent}
                            updateRedo={mediaMutations.updateRedo}
                        />
                    }
                    <CommentPopover
                        isCurrent={isCurrent}
                        content={userMedia.comment}
                        updateComment={mediaMutations.updateComment}
                    />
                </div>
            </div>
        </MediaCard>
    );
};
