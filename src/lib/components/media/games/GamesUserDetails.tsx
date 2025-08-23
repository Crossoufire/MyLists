import React from "react";
import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media-config";
import {UpdateRating} from "@/lib/components/media/base/UpdateRating";
import {UpdateStatus} from "@/lib/components/media/base/UpdateStatus";
import {UpdatePlatform} from "@/lib/components/media/games/UpdatePlatform";
import {UpdatePlaytime} from "@/lib/components/media/games/UpdatePlaytime";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


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
                    <Separator/>
                    <UpdatePlaytime
                        playtime={userMedia.playtime ?? 0}
                        updatePlaytime={updateUserMediaMutation}
                    />
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <UpdateRating
                            rating={userMedia.rating}
                            ratingSystem={userMedia.ratingSystem}
                            onUpdateMutation={updateUserMediaMutation}
                        />
                    </div>
                </>
            }
        </>
    );
};
