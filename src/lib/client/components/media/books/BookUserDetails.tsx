import React from "react";
import {useQueryClient} from "@tanstack/react-query";
import {MediaConfiguration} from "@/lib/client/components/media/media-config";
import {UpdateRedo} from "@/lib/client/components/media/base/UpdateRedo";
import {UpdateInput} from "@/lib/client/components/media/base/UpdateInput";
import {UpdateRating} from "@/lib/client/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/client/components/media/base/UpdateStatus";
import {MediaType, Status, UpdateType} from "@/lib/utils/enums";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


type BooksUserDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaUserDetails"]>[0];


export const BooksUserDetails = ({ userMedia, mediaType, queryKey }: BooksUserDetailsProps<typeof MediaType.BOOKS>) => {
    const queryClient = useQueryClient();
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryKey);

    const mediaData = getMediaData();

    function getMediaData() {
        // Easiest way to get 'pages' from media but no type safety :/.
        // 'Too complicated' to add type safety because media is a union type.

        if (queryKey[0] === "details") {
            const apiData: any = queryClient.getQueryData(queryKey);
            return apiData.media;
        }
        else if (queryKey[0] === "userList") {
            const apiData: any = queryClient.getQueryData(queryKey);
            return apiData.results.items.find((media: any) => media.mediaId === userMedia.mediaId);
        }
    }

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
                            total={mediaData.pages}
                            payloadName={"actualPage"}
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