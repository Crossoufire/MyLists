import {Badge} from "@/components/ui/badge";
import {MediaCard} from "@/components/app/MediaCard";
import {DotsVerticalIcon} from "@radix-ui/react-icons";
import {MediaInfoCorner} from "@/components/app/base/MediaInfoCorner";
import {RedoListDrop} from "@/components/medialist/RedoListDrop";
import {RatingComponent} from "@/components/app/RatingComponent";
import {userMediaMutations} from "@/api/mutations/mediaMutations";
import {EditMediaList} from "@/components/medialist/EditMediaList";
import {SuppMediaInfo} from "@/components/medialist/SuppMediaInfo";
import {CommentPopover} from "@/components/medialist/CommentPopover";
import {Route} from "@/routes/_private/list/$mediaType/$username/route";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";
import {useAuth} from "@/hooks/AuthHook";


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
    const search = Route.useSearch();
    const { currentUser } = useAuth();
    const { username, mediaType } = Route.useParams();
    const mediaMutations = userMediaMutations(mediaType, media.media_id, ["userList", mediaType, username, search]);

    const onStatusSuccess = (oldData, variables) => {
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

    const updateStatus = mediaMutations.updateStatusFunc(onStatusSuccess);

    const cardPending = (
        updateStatus.isPending ||
        mediaMutations.addToList.isPending ||
        mediaMutations.removeFromList.isPending
    );

    return (
        <MediaCard media={media} mediaType={mediaType} isPending={cardPending}>
            <div className="absolute top-2 right-1 z-10">
                {(isCurrent || ((!isCurrent && !!currentUser) && !media.common)) &&
                    <EditMediaList
                        status={media.status}
                        isCurrent={isCurrent}
                        updateStatus={updateStatus}
                        allStatus={media.all_status}
                        addOtherList={mediaMutations.addToList}
                        removeMedia={mediaMutations.removeFromList}
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
            {!!currentUser && <MediaInfoCorner isCommon={media.common}/>}
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-2 bg-gray-900 w-full rounded-b-sm">
                <h3 className="font-semibold line-clamp-1" title={media.media_name}>
                    {media.media_name}
                </h3>
                <Badge variant="outline">{media.status}</Badge>
                <div className="flex items-center justify-between h-[24px]">
                    <ManageFavorite
                        isCurrent={isCurrent}
                        isFavorite={media.favorite}
                        updateFavorite={mediaMutations.updateFavorite}
                    />
                    <RatingComponent
                        inline={true}
                        rating={media.rating}
                        isEditable={isCurrent}
                        onUpdate={mediaMutations.updateRating}
                    />
                    {(media.status === "Completed" && mediaType !== "games") &&
                        <RedoListDrop
                            redo={media.redo}
                            isCurrent={isCurrent}
                            updateRedo={mediaMutations.updateRedo}
                        />
                    }
                    <CommentPopover
                        isCurrent={isCurrent}
                        content={media.comment}
                        updateComment={mediaMutations.updateComment}
                    />
                </div>
            </div>
        </MediaCard>
    );
};
