import React from "react";
import {MediaType, Status, UpdateType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {UpdateRedo} from "@/lib/client/components/media/base/UpdateRedo";
import {UpdateInput} from "@/lib/client/components/media/base/UpdateInput";
import {UpdateRating} from "@/lib/client/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/client/components/media/base/UpdateStatus";
import {UpdateTextInput} from "@/lib/client/components/media/base/UpdateTextInput";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


type BooksUserDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["mediaUserDetails"]>[0];


export const BooksUserDetails = ({ userMedia, mediaType, queryOption }: BooksUserDetailsProps<typeof MediaType.BOOKS>) => {
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryOption);

    return (
        <>
            <UpdateStatus
                mediaType={mediaType}
                status={userMedia.status}
                updateStatus={updateUserMediaMutation}
            />
            <div className="flex justify-between items-center">
                <div>Total Pages</div>
                <UpdateInput
                    showTotal={false}
                    payloadName="pageCount"
                    initValue={userMedia.pageCount}
                    updateType={UpdateType.PAGE_COUNT}
                    updateInput={updateUserMediaMutation}
                />
            </div>
            <div className="flex justify-between items-center">
                <div>Language</div>
                <UpdateTextInput
                    payloadName="language"
                    initValue={userMedia.language}
                    updateType={UpdateType.LANGUAGE}
                    updateInput={updateUserMediaMutation}
                />
            </div>
            <div className="flex justify-between items-center">
                <div>Publisher</div>
                <UpdateTextInput
                    payloadName="publisher"
                    initValue={userMedia.publisher}
                    updateType={UpdateType.PUBLISHER}
                    updateInput={updateUserMediaMutation}
                />
            </div>
            {userMedia.status !== Status.PLAN_TO_READ &&
                <>
                    <div className="flex justify-between items-center">
                        <div>Current Page</div>
                        <UpdateInput
                            payloadName="actualPage"
                            total={userMedia.pageCount}
                            updateType={UpdateType.PAGE}
                            initValue={userMedia.actualPage}
                            updateInput={updateUserMediaMutation}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <UpdateRating
                            rating={userMedia.rating}
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
