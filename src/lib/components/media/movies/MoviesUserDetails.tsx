import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media/media-config";
import {UpdateRedo} from "@/lib/components/media/base/UpdateRedo";
import {UpdateRating} from "@/lib/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/components/media/base/UpdateStatus";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


type MoviesUserDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaUserDetails"]>[0];


export const MoviesUserDetails = ({ userMedia, mediaType, queryKey }: MoviesUserDetailsProps<typeof MediaType.MOVIES>) => {
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryKey);

    return (
        <>
            <UpdateStatus
                mediaType={mediaType}
                status={userMedia.status}
                updateStatus={updateUserMediaMutation}
            />
            {userMedia.status !== Status.PLAN_TO_WATCH &&
                <>
                    <Separator/>
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <UpdateRating
                            rating={userMedia.rating}
                            ratingSystem={userMedia.ratingSystem}
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
