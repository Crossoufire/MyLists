import {useState} from "react";
import {useUser} from "@/providers/UserProvider";
import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {PageInput} from "@/components/media/books/PageInput";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";


export const BooksUserDetails = ({ userData, totalPages, updatesAPI }) => {
    const { currentUser } = useUser();
    const [redo, setRedo] = useState(userData.rewatched);
    const [status, setStatus] = useState(userData.status);
    const [page, setPage] = useState(userData.actual_page);
    const [rating, setRating] = useState(userData.add_feeling ? userData.feeling : userData.score);

    const callbackStatus = (value) => {
        setStatus(value);

        if (value === "Completed") {
            setPage(totalPages);
        }

        if (value === "Plan to Read") {
            setPage(0);
        }

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
            {status !== "Plan to Read" &&
                <>
                    <PageInput
                        initPage={page}
                        totalPages={totalPages}
                        updatePage={updatesAPI.page}
                    />
                    <Separator/>
                    <RatingDrop
                        rating={rating}
                        isFeeling={currentUser.add_feeling}
                        updateRating={updatesAPI.rating}
                        callbackRating={callbackRating}
                    />
                </>
            }
            {status === "Completed" &&
                <RedoDrop
                    name="Re-read"
                    initRedo={redo}
                    updateRedo={updatesAPI.redo}
                />
            }
        </>
    )
};
