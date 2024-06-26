import {useState} from "react";
import {Separator} from "@/components/ui/separator";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {PlaytimeDrop} from "@/components/media/games/PlaytimeDrop";


export const GamesUserDetails = ({ userData, updatesAPI }) => {
    const [status, setStatus] = useState(userData.status);
    const [rating, setRating] = useState(userData.rating);
    const [playtime, setPlaytime] = useState(userData.playtime / 60);

    const callbackStatus = (value) => {
        setStatus(value);

        if (value === "Plan to Play") {
            setPlaytime(0);
        }
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
            {status !== "Plan to Play" &&
                <>
                    <Separator/>
                    <PlaytimeDrop
                        initPlaytime={playtime}
                        updatePlaytime={updatesAPI.playtime}
                    />
                    <RatingDrop
                        rating={rating}
                        updateRating={updatesAPI.rating}
                        callbackRating={callbackRating}
                    />
                </>
            }
        </>
    )
};
