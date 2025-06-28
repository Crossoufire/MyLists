import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {UpdateRedoTv} from "@/lib/components/user-media/tv/UpdateRedoTv";
import {UpdateRating} from "@/lib/components/user-media/base/UpdateRating";
import {UpdateStatus} from "@/lib/components/user-media/base/UpdateStatus";
import {UpdateSeasonsEps} from "@/lib/components/user-media/tv/UpdateSeasonsEps";
import {ExtractUserMediaByType} from "@/lib/components/user-media/base/UserMediaDetails";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface TvUserDetailsProps {
    queryKey: string[];
    mediaType: MediaType;
    userMedia: ExtractUserMediaByType<typeof MediaType.SERIES | typeof MediaType.ANIME>;
}


export const TvUserDetails = ({ userMedia, mediaType, queryKey }: TvUserDetailsProps) => {
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryKey);

    return (
        <>
            <UpdateStatus
                mediaType={mediaType}
                status={userMedia.status}
                updateStatus={updateUserMediaMutation}
            />
            {(userMedia.status !== Status.PLAN_TO_WATCH && userMedia.status !== Status.RANDOM) &&
                <UpdateSeasonsEps
                    //@ts-expect-error
                    epsPerSeason={userMedia.epsPerSeason}
                    currentSeason={userMedia.currentSeason}
                    onUpdateMutation={updateUserMediaMutation}
                    currentEpisode={userMedia.lastEpisodeWatched}
                />
            }
            {userMedia.status !== Status.PLAN_TO_WATCH &&
                <Separator/>
            }
            {userMedia.status !== Status.PLAN_TO_WATCH &&
                <div className="flex justify-between items-center">
                    <div>Rating</div>
                    <UpdateRating
                        rating={userMedia.rating}
                        ratingSystem={userMedia.ratingSystem}
                        onUpdateMutation={updateUserMediaMutation}
                    />
                </div>
            }
            {!(userMedia.status === Status.PLAN_TO_WATCH || userMedia.status === Status.RANDOM) &&
                <div className="flex justify-between items-center h-7">
                    <div>Re-watched</div>
                    <UpdateRedoTv
                        redoValues={userMedia.redo2}
                        onUpdateMutation={updateUserMediaMutation}
                    />
                </div>
            }
        </>
    );
};
