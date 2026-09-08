import React from "react";
import {MediaType, TvMediaType} from "@/lib/utils/enums";
import {Calendar, Clock, Tv} from "lucide-react";
import {extractYear} from "@/lib/utils/formatting/date";
import {formatMinutes} from "@/lib/utils/formatting/number";
import {DEFAULT_DASH_FALLBACK} from "@/lib/utils/constants";
import {MediaDetailsProps} from "@/lib/client/components/media/media-config.types";
import {MediaUnderItem, MediaUnderRating} from "@/lib/client/components/media/base/MediaDetailsComps";


type TvDetailsProps<T extends MediaType> = MediaDetailsProps<T>;


export const TvUnderTitle = ({ media }: TvDetailsProps<TvMediaType>) => {
    return (
        <>
            <MediaUnderRating
                voteCount={media.voteCount}
                voteAverage={media.voteAverage}
            />
            <MediaUnderItem icon={Calendar}>
                {extractYear(media.releaseDate)}
            </MediaUnderItem>
            <MediaUnderItem icon={Tv}>
                {media.totalSeasons ?? DEFAULT_DASH_FALLBACK} Seasons
            </MediaUnderItem>
            <MediaUnderItem icon={Clock}>
                {formatMinutes(media.duration, { compact: true })}
            </MediaUnderItem>
        </>
    );
};
