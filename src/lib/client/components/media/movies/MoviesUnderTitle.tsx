import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {Calendar, Star, Clock} from "lucide-react";
import {formatRuntime} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type MoviesDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["underTitle"]>[number];


export const MoviesUnderTitle = ({ media }: MoviesDetailsProps<typeof MediaType.MOVIES>) => {
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
                <Clock className="size-4 text-muted-foreground"/>
                <span>{formatRuntime(media.duration)}</span>
            </div>
        </>
    );
};
