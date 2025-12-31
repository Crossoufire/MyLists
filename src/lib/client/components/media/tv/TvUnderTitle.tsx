import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {Calendar, Tv, Clock} from "lucide-react";
import {formatDuration, getYear} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {MediaUnderItem, MediaUnderRating} from "@/lib/client/components/media/base/MediaDetailsComps";


type TvDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["underTitle"]>[number];


export const TvUnderTitle = ({ media }: TvDetailsProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    return (
        <>
            <MediaUnderRating
                voteCount={media.voteCount}
                voteAverage={media.voteAverage}
            />
            <MediaUnderItem icon={Calendar}>
                {getYear(media.releaseDate)}
            </MediaUnderItem>
            <MediaUnderItem icon={Tv}>
                {media.totalSeasons ?? "-"} Seasons
            </MediaUnderItem>
            <MediaUnderItem icon={Clock}>
                {formatDuration(media.duration)}
            </MediaUnderItem>
        </>
    );
};
