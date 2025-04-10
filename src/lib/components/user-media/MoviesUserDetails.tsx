import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {UpdateRedo} from "@/lib/components/user-media/UpdateRedo";
import {mediaDetailsOptions} from "@/lib/react-query/query-options";
import {UpdateStatus} from "@/lib/components/user-media/UpdateStatus";
import {UpdateRating} from "@/lib/components/user-media/UpdateRating";
import {useUpdateRedoMutation} from "@/lib/react-query/mutations/user-media.mutations";


interface MoviesUserDetailsProps {
    queryKey: string[];
    mediaType: MediaType;
    userMedia: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["userMedia"];
}


export const MoviesUserDetails = ({ userMedia, mediaType, queryKey }: MoviesUserDetailsProps) => {
    const mediaId = userMedia?.mediaId!;
    const updateRedoMutation = useUpdateRedoMutation(mediaType, mediaId, queryKey);

    const updateMedia = (media: any, status: Status) => ({ ...media, status, redo: 0 });

    function onStatusSuccess(oldData: any, variables: any) {
        const status = variables.payload;

        if (queryKey[0] === "details") {
            return { ...oldData, userMedia: updateMedia(oldData.userMedia, status) };
        }

        return {
            ...oldData, mediaData: oldData.mediaData.map((media: any) =>
                media.mediaId === userMedia?.mediaId ? updateMedia(media, status) : media
            )
        };
    }

    return (
        <>
            <UpdateStatus
                status={userMedia?.status}
                // updateStatus={updateStatus}
                // allStatus={userMedia.allStatus}
            />
            {userMedia?.status !== Status.PLAN_TO_WATCH &&
                <>
                    <Separator/>
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <UpdateRating
                            // onUpdate={updateRating}
                            rating={userMedia?.rating}
                        />
                    </div>
                    <UpdateRedo
                        name={"Re-watched"}
                        redo={userMedia?.redo}
                        updateRedo={updateRedoMutation}
                    />
                </>
            }
        </>
    );
};
