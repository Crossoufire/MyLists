import {MediaType} from "@/lib/server/utils/enums";
import {formatDateTime, zeroPad} from "@/lib/utils/functions";
import {ComingNextItem} from "@/lib/types/query.options.types";
import {MediaCard} from "@/lib/components/media/base/MediaCard";


interface ComingNextMediaProps {
    mediaType: MediaType;
    item: ComingNextItem;
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