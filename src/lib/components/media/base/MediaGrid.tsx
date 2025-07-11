import {useAuth} from "@/lib/hooks/use-auth";
import {StatusUtils} from "@/lib/utils/functions";
import {MediaType} from "@/lib/server/utils/enums";
import {UserMediaItem} from "@/lib/components/types";
import {MediaListItem} from "@/lib/components/media/base/MediaListItem";
import {queryKeys} from "@/lib/react-query/query-options/query-options";


interface MediaGridProps {
    isCurrent: boolean;
    mediaType: MediaType;
    mediaItems: UserMediaItem[];
    queryKey: ReturnType<typeof queryKeys.userListKey>;
}


export const MediaGrid = ({ isCurrent, mediaItems, queryKey, mediaType }: MediaGridProps) => {
    const { currentUser } = useAuth();
    const allStatuses = StatusUtils.byMediaType(mediaType);

    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:gap-4 lg:grid-cols-5 sm:gap-5">
            {mediaItems.map((userMedia) =>
                <MediaListItem
                    queryKey={queryKey}
                    userMedia={userMedia}
                    isCurrent={isCurrent}
                    mediaType={mediaType}
                    key={userMedia.mediaId}
                    allStatuses={allStatuses}
                    isConnected={!!currentUser}
                />
            )}
        </div>
    );
};
