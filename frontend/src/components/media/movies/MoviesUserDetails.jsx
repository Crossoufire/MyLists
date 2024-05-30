import {useState} from "react";
import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";


export const MoviesUserDetails = ({ userData, updatesAPI }) => {
    const [redo, setRedo] = useState(userData.rewatched);
    const [status, setStatus] = useState(userData.status);
    const [rating, setRating] = useState(userData.rating);

    const callbackStatus = (value) => {
        setStatus(value);
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
            {status !== "Plan to Watch" &&
                <>
                    <Separator/>
                    <RatingDrop
                        rating={rating}
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
