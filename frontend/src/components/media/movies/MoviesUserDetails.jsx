import {Separator} from "@/components/ui/separator";
import {RatingComponent} from "@/components/app/RatingComponent";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {userMediaMutations} from "@/api/mutations/mediaMutations";


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
                <div className="flex justify-between items-center">
                    <div>Rating</div>
                    <RatingComponent
                        onUpdate={updateRating}
                        rating={userData.rating}
                    />
                </div>
                <RedoDrop
                    name={"Re-watched"}
                    redo={userData.redo}
                    updateRedo={updateRedo}
                />
            </>
        }
        </>
    );
};
