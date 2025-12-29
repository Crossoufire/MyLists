import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {Calendar, Star, Clock} from "lucide-react";
import {formatMinutes} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type GamesDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["underTitle"]>[number];


export const GamesUnderTitle = ({ media }: GamesDetailsProps<typeof MediaType.GAMES>) => {
    return (
        <>
            <div className="flex items-center gap-1.5">
                <Star className="size-4 text-app-rating fill-app-rating"/>
                <span className="text-lg text-primary">
                    {media.voteAverage ? (media.voteAverage / 10).toFixed(1) : "-"}
                </span>
                <span className="text-muted-foreground text-xs">
                    ({media.voteCount?.toLocaleString()})
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <Calendar className="size-4 text-muted-foreground"/>
                <span>{media.releaseDate?.split("-")[0]}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Clock className="size-4 text-muted-foreground"/>
                <span>{media.hltbMainTime && formatMinutes(media.hltbMainTime * 60, true)}</span>
            </div>
        </>
    );
};
