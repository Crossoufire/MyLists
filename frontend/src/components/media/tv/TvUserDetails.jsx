import {useState} from "react";
import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {EpsSeasonsDrop} from "@/components/media/tv/EpsSeasonsDrop";


export const TvUserDetails = ({ userData, updatesAPI }) => {
    const [redo, setRedo] = useState(userData.rewatched);
    const [status, setStatus] = useState(userData.status);
    const [rating, setRating] = useState(userData.rating);
    const [season, setSeason] = useState(userData.current_season);
    const [episode, setEpisode] = useState(userData.last_episode_watched);

    const callbackStatus = (status) => {
        setStatus(status);

        if (episode === 0 && !["Plan to Watch", "Random"].includes(status)) {
            setEpisode(1);
        }

        if (["Plan to Watch", "Random"].includes(status)) {
            setSeason(1);
            setEpisode(1);
        }

        if (status === "Completed") {
            setSeason(userData.eps_per_season.length);
            setEpisode(userData.eps_per_season[userData.eps_per_season.length - 1]);
        }

        setRating({ ...rating });
        setRedo(0);
    };

    const callbackRating = (value) => {
        setRating({ ...rating, value });
    };

    return (
        <>
            <StatusDrop
                status={status}
                allStatus={userData.all_status}
                updateStatus={updatesAPI.status}
                callbackStatus={callbackStatus}
            />
            {(status !== "Plan to Watch" && status !== "Random") &&
                <EpsSeasonsDrop
                    initSeason={season}
                    initEpisode={episode}
                    epsPerSeason={userData.eps_per_season}
                    updateSeason={updatesAPI.season}
                    updateEpisode={updatesAPI.episode}
                />
            }
            {(status !== "Plan to Watch" || status === "Completed") &&
                <Separator/>
            }
            {status !== "Plan to Watch" &&
                <RatingDrop
                    rating={rating}
                    updateRating={updatesAPI.rating}
                    callbackRating={callbackRating}
                />
            }
            {status === "Completed" &&
                <RedoDrop
                    name="Re-watched"
                    initRedo={redo}
                    updateRedo={updatesAPI.redo}
                />
            }
        </>
    )
};
