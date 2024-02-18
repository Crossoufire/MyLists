import {useState} from "react";
import {useUser} from "@/providers/UserProvider";
import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";


export const MoviesUserDetails = ({ userData, updatesAPI }) => {
    const { currentUser } = useUser();
    const [redo, setRedo] = useState(userData.rewatched);
    const [status, setStatus] = useState(userData.status);
    const [rating, setRating] = useState(currentUser.add_feeling ? userData.feeling : userData.score);

    const callbackStatus = (value) => {
        setStatus(value);
        setRedo(0);
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
            {status !== "Plan to Watch" &&
                <>
                    <Separator/>
                    <RatingDrop
                        rating={rating}
                        isFeeling={currentUser.add_feeling}
                        updateRating={updatesAPI.rating}
                        callbackRating={callbackRating}
                    />
                    <RedoDrop
                        name="Re-watched"
                        initRedo={redo}
                        updateRedo={updatesAPI.redo}
                    />
                </>
            }
        </>
    )
};
