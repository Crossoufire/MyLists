import {Separator} from "@/components/ui/separator";
import {useUpdateUserMedia} from "@/utils/mutations";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {EpsSeasonsDrop} from "@/components/media/tv/EpsSeasonsDrop";


export const TvUserDetails = ({ userData, mediaType, mediaId }) => {
    const onRedoSuccess = (oldData, variables) => {
        return { ...oldData, user_data: { ...oldData.user_data, redo: variables.payload } };
    };
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
    const onRatingSuccess = (oldData, variables) => {
        return {
            ...oldData,
            user_data: {
                ...oldData.user_data,
                rating: {
                    ...oldData.user_data.rating,
                    value: variables.payload,
                }
            },
        };
    };
    const onSeasonSuccess = (oldData, variables) => {
        return {
            ...oldData,
            user_data: {
                ...oldData.user_data,
                current_season: variables.payload,
                last_episode_watched: 1,
            },
        };
    };
    const onEpisodeSuccess = (oldData, variables) => {
        return { ...oldData, user_data: { ...oldData.user_data, last_episode_watched: variables.payload } };
    };

    const redoMutation = useUpdateUserMedia("update_redo", mediaType, mediaId, onRedoSuccess);
    const statusMutation = useUpdateUserMedia("update_status", mediaType, mediaId, onStatusSuccess);
    const ratingMutation = useUpdateUserMedia("update_rating", mediaType, mediaId, onRatingSuccess);
    const seasonMutation = useUpdateUserMedia("update_season", mediaType, mediaId, onSeasonSuccess);
    const episodeMutation = useUpdateUserMedia("update_episode", mediaType, mediaId, onEpisodeSuccess);

    return (
        <>
            <StatusDrop
                status={userData.status}
                updateStatus={statusMutation}
                allStatus={userData.all_status}
            />
            {(userData.status !== "Plan to Watch" && userData.status !== "Random") &&
                <EpsSeasonsDrop
                    updateSeason={seasonMutation}
                    updateEpisode={episodeMutation}
                    epsPerSeason={userData.eps_per_season}
                    currentSeason={userData.current_season}
                    currentEpisode={userData.last_episode_watched}
                />
            }
            {(userData.status !== "Plan to Watch" || userData.status === "Completed") &&
                <Separator/>
            }
            {userData.status !== "Plan to Watch" &&
                <RatingDrop
                    rating={userData.rating}
                    updateRating={ratingMutation}
                />
            }
            {userData.status === "Completed" &&
                <RedoDrop
                    name={"Re-watched"}
                    redo={userData.redo}
                    updateRedo={redoMutation}
                />
            }
        </>
    )
};
