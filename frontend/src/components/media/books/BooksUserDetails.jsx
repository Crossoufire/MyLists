import {Separator} from "@/components/ui/separator";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {InputComponent} from "@/components/app/InputComponent";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {RatingComponent} from "@/components/app/RatingComponent";
import {userMediaMutations} from "@/api/mutations/mediaMutations";


export const BooksUserDetails = ({ userMedia, mediaType, queryKey }) => {
    const { updateRedo, updateRating, updatePage, updateStatusFunc } = userMediaMutations(mediaType, userMedia.media_id, queryKey);

    const onStatusSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        const status = variables.payload;
        newData.user_media.redo = 0;
        newData.user_media.status = status;
        if (status === "Completed") newData.user_media.actual_page = userMedia.total_pages;
        if (status === "Plan to Read") newData.user_media.actual_page = 0;
        return newData;
    };

    return (
        <>
            <StatusDrop
                status={userMedia.status}
                allStatus={userMedia.all_status}
                updateStatus={updateStatusFunc(onStatusSuccess)}
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
            {userMedia.status === "Completed" &&
                <RedoDrop
                    name={"Re-read"}
                    redo={userMedia.redo}
                    updateRedo={updateRedo}
                />
            }
        </>
    );
};
