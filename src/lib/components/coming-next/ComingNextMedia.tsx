import {MediaType} from "@/lib/server/utils/enums";
import {ComingNext} from "@/lib/server/types/base.types";
import {formatDateTime, zeroPad} from "@/lib/utils/functions";
import {MediaCard} from "@/lib/components/media/base/MediaCard";


interface ComingNextMediaProps {
    item: ComingNext;
    mediaType: MediaType;
}


export const ComingNextMedia = ({ item, mediaType }: ComingNextMediaProps) => {
    return (
        <MediaCard item={item} mediaType={mediaType}>
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-1 bg-gray-900 w-full rounded-b-sm text-center">
                {(mediaType === MediaType.ANIME || mediaType === MediaType.SERIES) &&
                    <div>S{zeroPad(item.seasonToAir!)}&nbsp;-&nbsp;E{zeroPad(item.episodeToAir!)}</div>
                }
                <div>{formatDateTime(item.date)}</div>
            </div>
        </MediaCard>
    );
};