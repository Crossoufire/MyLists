import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {UpdateRedo} from "@/lib/components/user-media/UpdateRedo";
import {UpdateStatus} from "@/lib/components/user-media/UpdateStatus";
import {useUpdateRedoMutation, useUpdateStatusMutation} from "@/lib/react-query/mutations/user-media.mutations";


interface MoviesUserDetailsProps {
    userMedia: any;
    queryKey: string[];
    mediaType: MediaType;
}


export const MoviesUserDetails = ({ userMedia, mediaType, queryKey }: MoviesUserDetailsProps) => {
    const updateRedoMutation = useUpdateRedoMutation(mediaType, userMedia.mediaId, queryKey);
    const updateStatusMutation = useUpdateStatusMutation(mediaType, userMedia.mediaId, queryKey);

    return (
        <>
            <UpdateStatus
                mediaType={mediaType}
                status={userMedia.status}
                updateStatus={updateStatusMutation}
            />
            {userMedia.status !== Status.PLAN_TO_WATCH &&
                <>
                    <Separator/>
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        {/*<UpdateRating*/}
                        {/*    // onUpdate={updateRating}*/}
                        {/*    rating={userMedia?.rating}*/}
                        {/*/>*/}
                    </div>
                    <UpdateRedo
                        name={"Re-watched"}
                        redo={userMedia.redo}
                        updateRedo={updateRedoMutation}
                    />
                </>
            }
        </>
    );
};
