import {MediaType, Status} from "@/lib/server/utils/enums";
import {Separator} from "@/lib/components/ui/separator";
import {UpdateStatus} from "@/lib/components/user-media/UpdateStatus";
import {UpdateRedoTv} from "@/lib/components/user-media/UpdateRedoTv";
import {UpdateRating} from "@/lib/components/user-media/UpdateRating";
import {UpdateSeasonsEps} from "@/lib/components/user-media/UpdateSeasonsEps";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface TvUserDetailsProps {
    userMedia: any;
    queryKey: string[];
    mediaType: MediaType;
}


export const TvUserDetails = ({ userMedia, mediaType, queryKey }: TvUserDetailsProps) => {
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryKey);

    // const updateMediaData = (media, status) => {
    //     const updatedMedia = { ...media, status: status };
    //
    //     if (userMedia.last_episode_watched === 0 && !["Plan to Watch", "Random"].includes(status)) {
    //         updatedMedia.last_episode_watched = 1;
    //     }
    //
    //     if (["Plan to Watch", "Random"].includes(status)) {
    //         updatedMedia.current_season = 1;
    //         updatedMedia.last_episode_watched = 1;
    //         updatedMedia.redo2 = Array(userMedia.eps_per_season.length).fill(0);
    //     }
    //
    //     if (status === "Completed") {
    //         updatedMedia.current_season = userMedia.eps_per_season.length;
    //         updatedMedia.last_episode_watched = userMedia.eps_per_season[userMedia.eps_per_season.length - 1];
    //     }
    //
    //     return updatedMedia;
    // };
    //
    // const onStatusListSuccess = (oldData, variables) => {
    //     const status = variables.payload;
    //
    //     return {
    //         ...oldData,
    //         media_data: oldData.media_data.map(m =>
    //             m.media_id === userMedia.media_id ? updateMediaData(m, status) : m
    //         )
    //     };
    // };
    //
    // const onStatusDetailsSuccess = (oldData, variables) => {
    //     const status = variables.payload;
    //     return {
    //         ...oldData,
    //         user_media: updateMediaData(oldData.user_media, status)
    //     };
    // };
    //
    // const onRedoUpdate = (redoValues) => {
    //     updateRedoTv.mutate({ payload: redoValues }, {
    //         onError: () => toast.error("An error occurred"),
    //         onSuccess: () => {
    //             toast.success("Seasons re-watched updated!");
    //             if (queryKey[0] === "details") {
    //                 queryClient.setQueryData(queryKey, (oldData) => {
    //                     return {
    //                         ...oldData,
    //                         user_media: {
    //                             ...oldData.user_media,
    //                             redo2: redoValues,
    //                         },
    //                     };
    //                 });
    //             }
    //             else {
    //                 queryClient.setQueryData(queryKey, (oldData) => {
    //                     return {
    //                         ...oldData,
    //                         media_data: oldData.media_data.map(m =>
    //                             m.media_id === userMedia.media_id ? { ...m, redo2: redoValues } : m
    //                         )
    //                     };
    //                 });
    //             }
    //         },
    //     });
    // };
    //
    // function onStatusSuccess(oldData, variables) {
    //     return queryKey[0] === "details" ? onStatusDetailsSuccess(oldData, variables) : onStatusListSuccess(oldData, variables);
    // }

    return (
        <>
            <UpdateStatus
                mediaType={mediaType}
                status={userMedia.status}
                updateStatus={updateUserMediaMutation}
            />
            {(userMedia.status !== Status.PLAN_TO_WATCH && userMedia.status !== Status.RANDOM) &&
                <UpdateSeasonsEps
                    epsPerSeason={userMedia.epsPerSeasons}
                    currentSeason={userMedia.currentSeason}
                    onUpdateMutation={updateUserMediaMutation}
                    currentEpisode={userMedia.lastEpisodeWatched}
                />
            }
            {(userMedia.status !== Status.PLAN_TO_WATCH || userMedia.status === Status.COMPLETED) &&
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
