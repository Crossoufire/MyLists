import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {UpdateRedo} from "@/lib/components/user-media/UpdateRedo";
import {UpdateRating} from "@/lib/components/user-media/UpdateRating";
import {UpdateStatus} from "@/lib/components/user-media/UpdateStatus";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface MoviesUserDetailsProps {
    userMedia: any;
    queryKey: string[];
    mediaType: MediaType;
}


export const MoviesUserDetails = ({ userMedia, mediaType, queryKey }: MoviesUserDetailsProps) => {
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryKey);

    console.log({ userMedia });

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
