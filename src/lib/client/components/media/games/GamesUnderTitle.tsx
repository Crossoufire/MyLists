import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {Calendar, Clock} from "lucide-react";
import {formatMinutes, getYear} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {MediaUnderItem, MediaUnderRating} from "@/lib/client/components/media/base/MediaDetailsComps";


type GamesDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["underTitle"]>[number];


export const GamesUnderTitle = ({ media }: GamesDetailsProps<typeof MediaType.GAMES>) => {
    return (
        <>
            <MediaUnderRating
                divisor={10}
                voteCount={media.voteCount}
                voteAverage={media.voteAverage}
            />
            <MediaUnderItem icon={Calendar}>
                {getYear(media.releaseDate)}
            </MediaUnderItem>
            <MediaUnderItem icon={Clock}>
                {media.hltbMainTime ? formatMinutes(media.hltbMainTime * 60, true) : "-"}
            </MediaUnderItem>
        </>
    );
};
