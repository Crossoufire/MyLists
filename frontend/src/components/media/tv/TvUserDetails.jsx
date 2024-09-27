import React from "react";
import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {RatingComponent} from "@/components/app/RatingComponent";
import {userMediaMutations} from "@/api/mutations/mediaMutations";
import {EpsSeasonsDrop} from "@/components/media/tv/EpsSeasonsDrop";


export const TvUserDetails = ({ userMedia, mediaType, queryKey }) => {
    const { updateRedo, updateRating, updateSeason, updateEpisode, updateStatusFunc } = userMediaMutations(
        mediaType, userMedia.media_id, queryKey
    );

    const onStatusSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        const status = variables.payload;
        newData.user_media.redo = 0;
        newData.user_media.status = status;

        if (userMedia.last_episode_watched === 0 && !["Plan to Watch", "Random"].includes(status)) {
            newData.user_media.last_episode_watched = 1;
        }
        if (["Plan to Watch", "Random"].includes(status)) {
            newData.user_media.current_season = 1;
            newData.user_media.last_episode_watched = 1;
        }
        if (status === "Completed") {
            newData.user_media.current_season = userMedia.eps_per_season.length;
            newData.user_media.last_episode_watched = userMedia.eps_per_season[userMedia.eps_per_season.length - 1];
        }

        return newData;
    };

    return (
        <>
            <StatusDrop
                status={userMedia.status}
                allStatus={userMedia.all_status}
                updateStatus={updateStatusFunc(onStatusSuccess)}
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
