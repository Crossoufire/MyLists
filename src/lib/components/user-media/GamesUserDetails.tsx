import React from "react";
import {Separator} from "@/lib/components/ui/separator";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {UpdateRating} from "@/lib/components/user-media/UpdateRating";
import {UpdateStatus} from "@/lib/components/user-media/UpdateStatus";
import {UpdatePlaytime} from "@/lib/components/user-media/UpdatePlaytime";
import {UpdatePlatform} from "@/lib/components/user-media/UpdatePlatform";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface GamesUserDetailsProps {
    userMedia: any;
    queryKey: string[];
    mediaType: MediaType;
}


export const GamesUserDetails = ({ userMedia, mediaType, queryKey }: GamesUserDetailsProps) => {
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
                        playtime={userMedia.playtime}
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
