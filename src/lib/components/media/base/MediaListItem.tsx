import {formatRating} from "@/lib/utils/functions";
import {ExtractListByType} from "@/lib/components/types";
import {mediaConfig} from "@/lib/components/media-config";
import {MediaType, Status} from "@/lib/server/utils/enums";


interface MediaListItemProps<T extends MediaType> {
    mediaType: T;
    queryKey: string[];
    isCurrent: boolean;
    isConnected: boolean;
    allStatuses: Status[];
    userMedia: ExtractListByType<T>;
}


export const MediaListItem = <T extends MediaType>(props: MediaListItemProps<T>) => {
    const { mediaType, queryKey, isCurrent, isConnected, allStatuses, userMedia } = props;

    const MediaItemComponent = mediaConfig[mediaType].mediaListCard;
    const rating = formatRating(userMedia.ratingSystem, userMedia.rating);

    return (
        <MediaItemComponent
            rating={rating}
            queryKey={queryKey}
            isCurrent={isCurrent}
            mediaType={mediaType}
            userMedia={userMedia}
            isConnected={isConnected}
            allStatuses={allStatuses}
        />
    );
};