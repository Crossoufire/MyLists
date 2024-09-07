import {Separator} from "@/components/ui/separator";
import {userMediaMutations} from "@/utils/mutations";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";


export const MoviesUserDetails = ({ userData, mediaType, mediaId }) => {
    const { updateRating, updateRedo, updateStatusFunc } = userMediaMutations(
        mediaType, mediaId, ["details", mediaType, mediaId.toString()]
    );

    const onStatusSuccess = (oldData, variables) => {
        return { ...oldData, user_data: { ...oldData.user_data, status: variables.payload, redo: 0 } };
    };

    return (
        <>
            <StatusDrop
                status={userData.status}
                allStatus={userData.all_status}
                updateStatus={updateStatusFunc(onStatusSuccess)}
            />
            {userData.status !== "Plan to Watch" &&
                <>
                    <Separator/>
                    <RatingDrop
                        rating={userData.rating}
                        updateRating={updateRating}
                    />
                    <RedoDrop
                        name={"Re-watched"}
                        redo={userData.redo}
                        updateRedo={updateRedo}
                    />
                </>
            }
        </>
    )
};
