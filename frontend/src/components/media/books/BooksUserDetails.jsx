import {Separator} from "@/components/ui/separator";
import {userMediaMutations} from "@/utils/mutations";
import {RedoDrop} from "@/components/media/general/RedoDrop";
import {PageInput} from "@/components/media/books/PageInput";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";


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
                    <PageInput
                        totalPages={totalPages}
                        updatePage={updatePage}
                        initPage={userData.actual_page}
                    />
                    <Separator/>
                    <RatingDrop
                        rating={userData.rating}
                        updateRating={updateRating}
                    />
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
    )
};
