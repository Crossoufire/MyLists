import React from "react";
import {MediaType, Status} from "@/lib/utils/enums";
import {MediaConfiguration} from "@/lib/client/components/media/media-config";
import {UpdateRating} from "@/lib/client/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/client/components/media/base/UpdateStatus";
import {UpdatePlatform} from "@/lib/client/components/media/games/UpdatePlatform";
import {UpdatePlaytime} from "@/lib/client/components/media/games/UpdatePlaytime";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


type GamesUserDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaUserDetails"]>[0];


export const GamesUserDetails = ({ userMedia, mediaType, queryKey }: GamesUserDetailsProps<typeof MediaType.GAMES>) => {
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryKey);

    return (
        <>
            <UpdateStatus
                mediaType={mediaType}
                status={userMedia.status}
                updateStatus={updateUserMediaMutation}
            />
            <UpdatePlatform
                platform={userMedia.platform}
                updatePlatform={updateUserMediaMutation}
            />
            {userMedia.status !== Status.PLAN_TO_PLAY &&
                <>
                    <UpdatePlaytime
                        playtime={userMedia.playtime ?? 0}
                        updatePlaytime={updateUserMediaMutation}
                    />
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <UpdateRating
                            rating={userMedia.rating}
                            onUpdateMutation={updateUserMediaMutation}
                        />
                    </div>
                </>
            }
        </>
    );
};
