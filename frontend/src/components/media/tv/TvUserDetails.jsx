import {useState} from "react";
import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {EpsSeasonsDrop} from "@/components/media/tv/EpsSeasonsDrop";


export const TvUserDetails = ({ userData, mediaData, updatesAPI }) => {
    const [redo, setRedo] = useState(userData.media_assoc.redo);
    const [status, setStatus] = useState(userData.media_assoc.status);
    const [rating, setRating] = useState(userData.media_assoc.rating);
    const [season, setSeason] = useState(userData.media_assoc.current_season);
    const [episode, setEpisode] = useState(userData.media_assoc.current_episode);

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
            setSeason(userData.eps_seasons.length);
            setEpisode(userData.eps_seasons[userData.eps_seasons.length - 1]);
        }

        setRating({ ...rating });
        setRedo(0);
    };

    const callbackRating = (value) => {
        setRating(value);
    };

    return (
        <>
            <StatusDrop
                status={status}
                callbackStatus={callbackStatus}
                updateStatus={updatesAPI.status}
                allStatus={userData.media_assoc.all_status}
            />
            {(status !== "Plan to Watch" && status !== "Random") &&
                <EpsSeasonsDrop
                    initSeason={season}
                    initEpisode={episode}
                    updateSeason={updatesAPI.season}
                    updateEpisode={updatesAPI.episode}
                    epsPerSeason={mediaData.eps_seasons}
                />
            }
            {(status !== "Plan to Watch" || status === "Completed") &&
                <Separator/>
            }
            {status !== "Plan to Watch" &&
                <RatingDrop
                    rating={rating}
                    callbackRating={callbackRating}
                    updateRating={updatesAPI.rating}
                />
            }
            {status === "Completed" &&
                <RedoDrop
                    initRedo={redo}
                    name={"Re-watched"}
                    updateRedo={updatesAPI.redo}
                />
            }
        </>
    )
};
