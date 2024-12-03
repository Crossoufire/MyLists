import {userMediaMutations} from "@mylists/api";
import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media-user/RedoDrop";
import {StatusDrop} from "@/components/media-user/StatusDrop";
import {RatingComponent} from "@/components/app/RatingComponent";
import {EpsSeasonsDrop} from "@/components/media-user/EpsSeasonsDrop";


export const TvUserDetails = ({ userMedia, mediaType, queryKey }) => {
    const { updateRedo, updateRating, updateSeason, updateEpisode, updateStatusFunc } = userMediaMutations(
        mediaType, userMedia.media_id, queryKey
    );

    const updateMediaData = (media, status) => {
        const updatedMedia = { ...media, redo: 0, status: status };

        if (userMedia.last_episode_watched === 0 && !["Plan to Watch", "Random"].includes(status)) {
            updatedMedia.last_episode_watched = 1;
        }

        if (["Plan to Watch", "Random"].includes(status)) {
            updatedMedia.current_season = 1;
            updatedMedia.last_episode_watched = 1;
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

    const onStatusChanged = (oldData, variables) => {
        return queryKey[0] === "details" ? onStatusDetailsSuccess(oldData, variables) : onStatusListSuccess(oldData, variables);
    };

    return (
        <>
            <StatusDrop
                status={userMedia.status}
                allStatus={userMedia.all_status}
                updateStatus={updateStatusFunc(onStatusChanged)}
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
            {userMedia.status === "Completed" &&
                <RedoDrop
                    name={"Re-watched"}
                    redo={userMedia.redo}
                    updateRedo={updateRedo}
                />
            }
        </>
    );
};
