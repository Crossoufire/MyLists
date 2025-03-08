import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media-user/RedoDrop";
import {StatusDrop} from "@/components/media-user/StatusDrop";
import {RatingComponent} from "@/components/app/RatingComponent";
import {InputComponent} from "@/components/media-user/InputComponent";
import {useUpdateStatusMutation, useUserMediaMutations} from "@/api/mutations";


export const BooksUserDetails = ({ userMedia, mediaType, queryKey }) => {
    const updateStatus = useUpdateStatusMutation(mediaType, userMedia.media_id, queryKey, onStatusSuccess);
    const { updateRedo, updateRating, updatePage } = useUserMediaMutations(mediaType, userMedia.media_id, queryKey);

    const updateMedia = (media, status) => {
        const updatedMedia = { ...media, status: status };

        if (status === "Completed") {
            updatedMedia.actual_page = userMedia.total_pages;
        }
        if (status === "Plan to Read") {
            updatedMedia.actual_page = 0;
            updatedMedia.redo = 0;
        }

        return updatedMedia;
    };

    function onStatusSuccess(oldData, variables) {
        const status = variables.payload;

        if (queryKey[0] === "details") {
            return { ...oldData, user_media: updateMedia(oldData.user_media, status) };
        }

        return {
            ...oldData,
            media_data: oldData.media_data.map(m =>
                m.media_id === userMedia.media_id ? updateMedia(m, status) : m
            )
        };
    }

    return (
        <>
            <StatusDrop
                status={userMedia.status}
                updateStatus={updateStatus}
                allStatus={userMedia.all_status}
            />
            {userMedia.status !== "Plan to Read" &&
                <>
                    <div className="flex justify-between items-center">
                        <div>Pages</div>
                        <InputComponent
                            onUpdate={updatePage}
                            inputClassName={"w-[60px]"}
                            total={userMedia.total_pages}
                            containerClassName={"w-[135px]"}
                            initValue={userMedia.actual_page}
                        />
                    </div>
                    <Separator/>
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <RatingComponent
                            onUpdate={updateRating}
                            rating={userMedia.rating}
                        />
                    </div>
                </>
            }
            {userMedia.status !== "Plan to Read" &&
                <RedoDrop
                    name={"Re-read"}
                    redo={userMedia.redo}
                    updateRedo={updateRedo}
                />
            }
        </>
    );
};
