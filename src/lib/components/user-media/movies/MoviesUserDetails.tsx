import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {UpdateRedo} from "@/lib/components/user-media/base/UpdateRedo";
import {UpdateRating} from "@/lib/components/user-media/base/UpdateRating";
import {UpdateStatus} from "@/lib/components/user-media/base/UpdateStatus";
import {ExtractUserMediaByType} from "@/lib/components/user-media/base/UserMediaDetails";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface MoviesUserDetailsProps {
    queryKey: string[];
    mediaType: MediaType;
    userMedia: ExtractUserMediaByType<typeof MediaType.MOVIES>;
}


export const MoviesUserDetails = ({ userMedia, mediaType, queryKey }: MoviesUserDetailsProps) => {
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
