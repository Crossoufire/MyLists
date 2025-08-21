import React from "react";
import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {ExtractUserMediaByType} from "@/lib/components/types";
import {UpdateRedo} from "@/lib/components/media/base/UpdateRedo";
import {UpdateInput} from "@/lib/components/media/base/UpdateInput";
import {UpdateRating} from "@/lib/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/components/media/base/UpdateStatus";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface BooksUserDetailsProps {
    mediaType: MediaType;
    userMedia: ExtractUserMediaByType<typeof MediaType.BOOKS>;
    queryKey: ReturnType<typeof queryKeys.userListKey> | ReturnType<typeof queryKeys.detailsKey>;
}


export const BooksUserDetails = ({ userMedia, mediaType, queryKey }: BooksUserDetailsProps) => {
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryKey);

    return (
        <>
            <UpdateStatus
                mediaType={mediaType}
                status={userMedia.status}
                updateStatus={updateUserMediaMutation}
            />
            {userMedia.status !== Status.PLAN_TO_READ &&
                <>
                    <div className="flex justify-between items-center">
                        <div>Pages</div>
                        <UpdateInput
                            total={userMedia.total}
                            inputClassName={"w-[60px]"}
                            containerClassName={"w-[135px]"}
                            initValue={userMedia.actualPage}
                            updateInput={updateUserMediaMutation}
                        />
                    </div>
                    <Separator/>
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <UpdateRating
                            rating={userMedia.rating}
                            ratingSystem={userMedia.ratingSystem}
                            onUpdateMutation={updateUserMediaMutation}
                        />
                    </div>
                </>
            }
            {userMedia.status !== Status.PLAN_TO_READ &&
                <UpdateRedo
                    name={"Re-read"}
                    redo={userMedia.redo}
                    updateRedo={updateUserMediaMutation}
                />
            }
        </>
    );
};