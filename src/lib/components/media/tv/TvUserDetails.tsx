import {useQueryClient} from "@tanstack/react-query";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media/media-config";
import {UpdateTvRedo} from "@/lib/components/media/tv/UpdateTvRedo";
import {UpdateRating} from "@/lib/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/components/media/base/UpdateStatus";
import {UpdateSeasonsEps} from "@/lib/components/media/tv/UpdateSeasonsEps";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


type TvUserDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaUserDetails"]>[0];


export const TvUserDetails = ({ userMedia, mediaType, queryKey }: TvUserDetailsProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    const queryClient = useQueryClient();
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryKey);
    const mediaData = getMediaData();

    function getMediaData() {
        // Easiest way to get 'epsPerSeason' from media but no type safety :/.
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
            {(userMedia.status !== Status.PLAN_TO_WATCH && userMedia.status !== Status.RANDOM) &&
                <UpdateSeasonsEps
                    epsPerSeason={mediaData.epsPerSeason}
                    currentSeason={userMedia.currentSeason}
                    onUpdateMutation={updateUserMediaMutation}
                    currentEpisode={userMedia.lastEpisodeWatched}
                />
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
