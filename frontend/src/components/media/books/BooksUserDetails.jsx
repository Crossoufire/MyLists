import {Separator} from "@/components/ui/separator";
import {useUpdateUserMedia} from "@/utils/mutations";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {PageInput} from "@/components/media/books/PageInput";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";


export const BooksUserDetails = ({ userData, mediaType, mediaId, totalPages }) => {
    const onRedoSuccess = (oldData, variables) => {
        return { ...oldData, user_data: { ...oldData.user_data, redo: variables.payload } };
    };
    const onStatusSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        const status = variables.payload;
        newData.user_data.redo = 0;
        newData.user_data.status = status;
        if (status === "Completed") newData.user_data.actual_page = totalPages;
        if (status === "Plan to Read") newData.user_data.actual_page = 0;
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
    const onPageSuccess = (oldData, variables) => {
        return { ...oldData, user_data: { ...oldData.user_data, actual_page: variables.payload } };
    };

    const redoMutation = useUpdateUserMedia("update_redo", mediaType, mediaId, onRedoSuccess);
    const pageMutation = useUpdateUserMedia("update_page", mediaType, mediaId, onPageSuccess);
    const statusMutation = useUpdateUserMedia("update_status", mediaType, mediaId, onStatusSuccess);
    const ratingMutation = useUpdateUserMedia("update_rating", mediaType, mediaId, onRatingSuccess);

    return (
        <>
            <StatusDrop
                status={userData.status}
                updateStatus={statusMutation}
                allStatus={userData.all_status}
            />
            {userData.status !== "Plan to Read" &&
                <>
                    <PageInput
                        totalPages={totalPages}
                        updatePage={pageMutation}
                        initPage={userData.actual_page}
                    />
                    <Separator/>
                    <RatingDrop
                        rating={userData.rating}
                        updateRating={ratingMutation}
                    />
                </>
            }
            {userData.status === "Completed" &&
                <RedoDrop
                    name={"Re-read"}
                    redo={userData.redo}
                    updateRedo={redoMutation}
                />
            }
        </>
    )
};
