import {Separator} from "@/components/ui/separator";
import {StatusDrop} from "@/components/media-user/StatusDrop";
import {RatingComponent} from "@/components/app/RatingComponent";
import {TvRedoSystem} from "@/components/media-user/TvRedoSystem";
import {EpsSeasonsDrop} from "@/components/media-user/EpsSeasonsDrop";
import {useUpdateStatusMutation, useUserMediaMutations} from "@/api/mutations";


export const TvUserDetails = ({ userMedia, mediaType, queryKey }) => {
    const updateStatus = useUpdateStatusMutation(mediaType, userMedia.media_id, queryKey, onStatusSuccess);
    const { updateRating, updateSeason, updateEpisode } = useUserMediaMutations(mediaType, userMedia.media_id, queryKey);

    const updateMediaData = (media, status) => {
        const updatedMedia = { ...media, status: status };

        if (userMedia.last_episode_watched === 0 && !["Plan to Watch", "Random"].includes(status)) {
            updatedMedia.last_episode_watched = 1;
        }

        if (["Plan to Watch", "Random"].includes(status)) {
            updatedMedia.current_season = 1;
            updatedMedia.last_episode_watched = 1;
            updatedMedia.redo2 = Array(userMedia.eps_per_season.length).fill(0);
        }

        if (status === "Completed") {
            updatedMedia.current_season = userMedia.eps_per_season.length;
            updatedMedia.last_episode_watched = userMedia.eps_per_season[userMedia.eps_per_season.length - 1];
        }

        return updatedMedia;
    };

    const onStatusListSuccess = (oldData, variables) => {
        const status = variables.payload;

        return {
            ...oldData,
            media_data: oldData.media_data.map(m =>
                m.media_id === userMedia.media_id ? updateMediaData(m, status) : m
            )
        };
    };

    const onStatusDetailsSuccess = (oldData, variables) => {
        const status = variables.payload;
        return {
            ...oldData,
            user_media: updateMediaData(oldData.user_media, status)
        };
    };

    function onStatusSuccess(oldData, variables) {
        return queryKey[0] === "details" ? onStatusDetailsSuccess(oldData, variables) : onStatusListSuccess(oldData, variables);
    }

    return (
        <>
            <StatusDrop
                status={userMedia.status}
                updateStatus={updateStatus}
                allStatus={userMedia.all_status}
            />
            {(userMedia.status !== "Plan to Watch" && userMedia.status !== "Random") &&
                <EpsSeasonsDrop
                    updateSeason={updateSeason}
                    updateEpisode={updateEpisode}
                    epsPerSeason={userMedia.eps_per_season}
                    currentSeason={userMedia.current_season}
                    currentEpisode={userMedia.last_episode_watched}
                />
            }
            {(userMedia.status !== "Plan to Watch" || userMedia.status === "Completed") &&
                <Separator/>
            }
            {userMedia.status !== "Plan to Watch" &&
                <div className="flex justify-between items-center">
                    <div>Rating</div>
                    <RatingComponent
                        onUpdate={updateRating}
                        rating={userMedia.rating}
                    />
                </div>
            }
            {!(userMedia.status === "Plan to Watch" || userMedia.status === "Random") &&
                <div className="flex justify-between items-center h-7">
                    <div>Re-watched</div>
                    <TvRedoSystem
                        mediaType={mediaType}
                        mediaId={userMedia.media_id}
                        initRedoList={userMedia.redo2}
                    />
                </div>
            }
        </>
    );
};
