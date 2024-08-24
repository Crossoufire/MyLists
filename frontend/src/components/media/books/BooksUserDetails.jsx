import {useState} from "react";
import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {PageInput} from "@/components/media/books/PageInput";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";


export const BooksUserDetails = ({ userData, totalPages, updatesAPI }) => {
    const [redo, setRedo] = useState(userData.redo);
    const [status, setStatus] = useState(userData.status);
    const [rating, setRating] = useState(userData.rating);
    const [page, setPage] = useState(userData.actual_page);

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
