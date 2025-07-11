import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {ExtractUserMediaByType} from "@/lib/components/types";
import {UpdateTvRedo} from "@/lib/components/media/tv/UpdateTvRedo";
import {UpdateRating} from "@/lib/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/components/media/base/UpdateStatus";
import {UpdateSeasonsEps} from "@/lib/components/media/tv/UpdateSeasonsEps";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";
import {queryKeys} from "@/lib/react-query/query-options/query-options";


interface TvUserDetailsProps {
    mediaType: MediaType;
    userMedia: ExtractUserMediaByType<typeof MediaType.SERIES | typeof MediaType.ANIME>;
    queryKey: ReturnType<typeof queryKeys.userListKey> | ReturnType<typeof queryKeys.detailsKey>;
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
                    epsPerSeason={userMedia.epsPerSeason!}
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
                    <UpdateTvRedo
                        redoValues={userMedia.redo2}
                        onUpdateMutation={updateUserMediaMutation}
                    />
                </div>
            }
        </>
    );
};
