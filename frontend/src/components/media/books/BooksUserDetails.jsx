import {Separator} from "@/components/ui/separator";
import {InputComponent} from "@/components/app/InputComponent";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {userMediaMutations} from "@/api/mutations/mediaMutations";
import {RatingComponent} from "@/components/app/RatingComponent";
import React from "react";


export const BooksUserDetails = ({ userData, mediaType, mediaId, totalPages }) => {
    const { updateRedo, updateRating, updatePage, updateStatusFunc } = userMediaMutations(
        mediaType, mediaId, ["details", mediaType, mediaId.toString()]
    );

    const onStatusSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        const status = variables.payload;
        newData.user_data.redo = 0;
        newData.user_data.status = status;
        if (status === "Completed") newData.user_data.actual_page = totalPages;
        if (status === "Plan to Read") newData.user_data.actual_page = 0;
        return newData;
    };

    return (
        <>
            <StatusDrop
                status={userData.status}
                allStatus={userData.all_status}
                updateStatus={updateStatusFunc(onStatusSuccess)}
            />
            {userData.status !== "Plan to Read" &&
                <>
                    <div className="flex justify-between items-center">
                        <div>Pages</div>
                        <InputComponent
                            total={totalPages}
                            onUpdate={updatePage}
                            inputClassName={"w-[60px]"}
                            initValue={userData.actual_page}
                            containerClassName={"w-[135px]"}
                        />
                    </div>
                    <Separator/>
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <RatingComponent
                            onUpdate={updateRating}
                            rating={userData.rating}
                        />
                    </div>
                </>
            }
            {userData.status === "Completed" &&
                <RedoDrop
                    name={"Re-read"}
                    redo={userData.redo}
                    updateRedo={updateRedo}
                />
            }
        </>
    );
};
