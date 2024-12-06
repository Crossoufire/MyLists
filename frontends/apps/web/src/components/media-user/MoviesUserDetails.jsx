import {userMediaMutations} from "@mylists/api/src";
import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media-user/RedoDrop";
import {StatusDrop} from "@/components/media-user/StatusDrop";
import {RatingComponent} from "@/components/app/RatingComponent";


export const MoviesUserDetails = ({ userMedia, mediaType, queryKey }) => {
    const { updateRating, updateRedo, updateStatusFunc } = userMediaMutations(mediaType, userMedia.media_id, queryKey);

    const updateMedia = (media, status) => ({ ...media, status, redo: 0 });

    const onStatusSuccess = (oldData, variables) => {
        const status = variables.payload;

        if (queryKey[0] === "details") {
            return { ...oldData, user_media: updateMedia(oldData.user_media, status) };
        }

        return {
            ...oldData, media_data: oldData.media_data.map(m =>
                m.media_id === userMedia.media_id ? updateMedia(m, status) : m
            )
        };
    };

    return (
        <>
            <StatusDrop
                status={userMedia.status}
                allStatus={userMedia.all_status}
                updateStatus={updateStatusFunc(onStatusSuccess)}
            />
            {userMedia.status !== "Plan to Watch" &&
                <>
                    <Separator/>
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <RatingComponent
                            onUpdate={updateRating}
                            rating={userMedia.rating}
                        />
                    </div>
                    <RedoDrop
                        name={"Re-watched"}
                        redo={userMedia.redo}
                        updateRedo={updateRedo}
                    />
                </>
            }
        </>
    );
};
