import {MediaType, Status} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {UpdateRedo} from "@/lib/client/components/media/base/UpdateRedo";
import {UpdateRating} from "@/lib/client/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/client/components/media/base/UpdateStatus";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


type MoviesUserDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["mediaUserDetails"]>[number];


export const MoviesUserDetails = ({ userMedia, mediaType, queryOption }: MoviesUserDetailsProps<typeof MediaType.MOVIES>) => {
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryOption);

    return (
        <>
            <UpdateStatus
                mediaType={mediaType}
                status={userMedia.status}
                updateStatus={updateUserMediaMutation}
            />
            {userMedia.status !== Status.PLAN_TO_WATCH &&
                <>
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <UpdateRating
                            rating={userMedia.rating}
                            onUpdateMutation={updateUserMediaMutation}
                        />
                    </div>
                    <UpdateRedo
                        name={"Re-watched"}
                        redo={userMedia.redo}
                        updateRedo={updateUserMediaMutation}
                    />
                </>
            }
        </>
    );
};
