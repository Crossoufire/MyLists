import {useUpdateUserMedia} from "@/utils/mutations";
import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";


export const MoviesUserDetails = ({ userData, mediaType, mediaId }) => {
    const onRedoSuccess = (oldData, variables) => {
        return { ...oldData, user_data: { ...oldData.user_data, redo: variables.payload } };
    };
    const onStatusSuccess = (oldData, variables) => {
        return { ...oldData, user_data: { ...oldData.user_data, status: variables.payload, redo: 0 } };
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

    const redoMutation = useUpdateUserMedia("update_redo", mediaType, mediaId, onRedoSuccess);
    const statusMutation = useUpdateUserMedia("update_status", mediaType, mediaId, onStatusSuccess);
    const ratingMutation = useUpdateUserMedia("update_rating", mediaType, mediaId, onRatingSuccess);

    return (
        <>
            <StatusDrop
                status={userData.status}
                updateStatus={statusMutation}
                allStatus={userData.all_status}
            />
            {userData.status !== "Plan to Watch" &&
                <>
                    <Separator/>
                    <RatingDrop
                        rating={userData.rating}
                        updateRating={ratingMutation}
                    />
                    <RedoDrop
                        name={"Re-watched"}
                        redo={userData.redo}
                        updateRedo={redoMutation}
                    />
                </>
            }
        </>
    )
};
