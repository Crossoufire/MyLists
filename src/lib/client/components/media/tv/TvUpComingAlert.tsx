import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {zeroPad} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {UpComingAlert} from "@/lib/client/components/media/base/MediaDetailsComps";


type TvDetailsProps<T extends MediaType> = Parameters<NonNullable<MediaConfig[T]["upComingAlert"]>>[number];


export const TvUpComingAlert = ({ media }: TvDetailsProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    if (!media.nextEpisodeToAir) return null;

    return (
        <UpComingAlert title="Next Episode" dateString={media.nextEpisodeToAir}>
            <>
                <span>
                    S{zeroPad(media.seasonToAir)}.E{zeroPad(media.episodeToAir)}
                </span>
                <span>•</span>
            </>
        </UpComingAlert>
    );
};
