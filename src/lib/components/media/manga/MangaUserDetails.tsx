import React from "react";
import {useQueryClient} from "@tanstack/react-query";
import {Separator} from "@/lib/components/ui/separator";
import {MediaConfiguration} from "@/lib/components/media/media-config";
import {UpdateRedo} from "@/lib/components/media/base/UpdateRedo";
import {UpdateInput} from "@/lib/components/media/base/UpdateInput";
import {UpdateRating} from "@/lib/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/components/media/base/UpdateStatus";
import {MediaType, Status, UpdateType} from "@/lib/server/utils/enums";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


type MangaUserDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaUserDetails"]>[0];


export const MangaUserDetails = ({ userMedia, mediaType, queryKey }: MangaUserDetailsProps<typeof MediaType.MANGA>) => {
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
                        <div>Chapters</div>
                        <UpdateInput
                            total={mediaData.chapters}
                            payloadName={"currentChapter"}
                            updateType={UpdateType.CHAPTER}
                            initValue={userMedia.currentChapter}
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