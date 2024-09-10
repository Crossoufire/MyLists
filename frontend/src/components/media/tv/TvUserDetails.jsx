import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {EpsSeasonsDrop} from "@/components/media/tv/EpsSeasonsDrop";
import {userMediaMutations} from "@/api/mutations/mediaMutations";
import {RatingComponent} from "@/components/app/RatingComponent";
import React from "react";


export const TvUserDetails = ({ userData, mediaType, mediaId }) => {
    const { updateRedo, updateRating, updateSeason, updateEpisode, updateStatusFunc } = userMediaMutations(
        mediaType, mediaId, ["details", mediaType, mediaId.toString()]
    );

    const onStatusSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        const status = variables.payload;
        newData.user_data.redo = 0;
        newData.user_data.status = status;

        if (userData.last_episode_watched === 0 && !["Plan to Watch", "Random"].includes(status)) {
            newData.user_data.last_episode_watched = 1;
        }
        if (["Plan to Watch", "Random"].includes(status)) {
            newData.user_data.current_season = 1;
            newData.user_data.last_episode_watched = 1;
        }
        if (status === "Completed") {
            newData.user_data.current_season = userData.eps_per_season.length;
            newData.user_data.last_episode_watched = userData.eps_per_season[userData.eps_per_season.length - 1];
        }

        return newData;
    };

    return (
        <>
            <StatusDrop
                status={userData.status}
                updateStatus={updateStatusFunc(onStatusSuccess)}
                allStatus={userData.all_status}
            />
            {(userData.status !== "Plan to Watch" && userData.status !== "Random") &&
                <EpsSeasonsDrop
                    updateSeason={updateSeason}
                    updateEpisode={updateEpisode}
                    epsPerSeason={userData.eps_per_season}
                    currentSeason={userData.current_season}
                    currentEpisode={userData.last_episode_watched}
                />
            }
            {(userData.status !== "Plan to Watch" || userData.status === "Completed") &&
                <Separator/>
            }
            {userData.status !== "Plan to Watch" &&
                <div className="flex justify-between items-center">
                    <div>Rating</div>
                    <RatingComponent
                        onUpdate={updateRating}
                        rating={userData.rating}
                    />
                </div>
            }
            {userData.status === "Completed" &&
                <RedoDrop
                    name={"Re-watched"}
                    redo={userData.redo}
                    updateRedo={updateRedo}
                />
            }
        </>
    );
};
