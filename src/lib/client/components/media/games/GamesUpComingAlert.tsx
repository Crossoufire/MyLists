import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {UpComingAlert} from "@/lib/client/components/media/base/MediaDetailsComps";
import {CURRENT_DATE} from "@/lib/utils/formating";


type GamesDetailsProps<T extends MediaType> = Parameters<NonNullable<MediaConfig[T]["upComingAlert"]>>[number];


export const GamesUpComingAlert = ({ media }: GamesDetailsProps<typeof MediaType.GAMES>) => {
    if (!media.releaseDate || CURRENT_DATE.getTime() > new Date(media.releaseDate).getTime()) return null;

    return (
        <UpComingAlert
            title="Game Release"
            dateString={media.releaseDate}
        />
    );
};
