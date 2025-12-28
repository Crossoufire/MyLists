import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {Calendar, Star, Tv, Clock} from "lucide-react";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type TvDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["underTitle"]>[number];


export const TvUnderTitle = ({ media }: TvDetailsProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    return (
        <>
            <div className="flex items-center gap-1.5">
                <Star className="size-4 text-app-rating fill-app-rating"/>
                <span className="text-lg text-primary">
                    {media.voteAverage?.toFixed(1)}
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
                <Tv className="size-4 text-muted-foreground"/>
                <span>{media.totalSeasons} Seasons</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Clock className="size-4 text-muted-foreground"/>
                <span>{formatRuntime(media.duration)}</span>
            </div>
        </>
    );
};


const formatRuntime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
