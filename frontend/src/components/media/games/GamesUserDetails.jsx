import {useState} from "react";
import {userClient} from "@/api/MyApiClient";
import {Separator} from "@/components/ui/separator";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {PlaytimeDrop} from "@/components/media/games/PlaytimeDrop";


export const GamesUserDetails = ({ userData, updatesAPI }) => {
    const currentUser = userClient.currentUser;
    const [status, setStatus] = useState(userData.status);
    const [playtime, setPlaytime] = useState(userData.playtime / 60);
    const [rating, setRating] = useState(currentUser.add_feeling ? userData.feeling : userData.score);

    const callbackStatus = (value) => {
        setStatus(value);

        if (value === "Plan to Play") {
            setPlaytime(0);
        }
    };

    const callbackRating = (value) => {
        setRating(value);
    }

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
                        isFeeling={currentUser.add_feeling}
                        updateRating={updatesAPI.rating}
                        callbackRating={callbackRating}
                    />
                </>
            }
        </>
    )
};
