import {MediaType} from "@/lib/utils/enums";
import {formatDateTime, getStatusColor, getTextColor, zeroPad} from "@/lib/utils/functions";
import {ComingNextItem} from "@/lib/types/query.options.types";
import {MediaCard} from "@/lib/client/components/media/base/MediaCard";
import {Badge} from "@/lib/client/components/ui/badge";


interface ComingNextMediaProps {
    mediaType: MediaType;
    item: ComingNextItem;
}


export const ComingNextMedia = ({ item, mediaType }: ComingNextMediaProps) => {
    return (
        <MediaCard item={item} mediaType={mediaType}>
            <div className="absolute top-1 right-1">
                <Badge
                    className="shrink-0"
                    style={{
                        background: getStatusColor(item.status),
                        color: getTextColor(getStatusColor(item.status)),
                    }}
                >
                    {item.status}
                </Badge>
            </div>
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-1 bg-gray-900 w-full rounded-b-sm text-center">
                {(mediaType === MediaType.ANIME || mediaType === MediaType.SERIES) && "seasonToAir" in item && "episodeToAir" in item &&
                    <div>
                        S{zeroPad(item.seasonToAir)}
                        {" "}-{" "}
                        E{zeroPad(item.episodeToAir)}
                    </div>
                }
                <div>
                    {formatDateTime(item.date, { noTime: true })}
                </div>

            </div>
        </MediaCard>
    );
};
