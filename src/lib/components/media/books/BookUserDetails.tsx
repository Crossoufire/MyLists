import React from "react";
import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media-config";
import {UpdateRedo} from "@/lib/components/media/base/UpdateRedo";
import {UpdateInput} from "@/lib/components/media/base/UpdateInput";
import {UpdateRating} from "@/lib/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/components/media/base/UpdateStatus";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


type BooksUserDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaUserDetails"]>[0];


export const BooksUserDetails = ({ userMedia, mediaType, queryKey }: BooksUserDetailsProps<typeof MediaType.BOOKS>) => {
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
                            total={userMedia.pages!}
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