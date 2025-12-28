import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {formatDateTime, formatMinutes} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type TvDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["infoGrid"]>[number];


export const TvInfoGrid = ({ mediaType, media }: TvDetailsProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    const creators = media.createdBy?.split(", ").map((c) => ({ name: c })) || [];

    return (
        <>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Status
                </span>
                <p className="font-medium text-sm">
                    {media.prodStatus}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Created By
                </span>
                <p className="font-medium text-sm wrap-break-word">
                    {creators.map((c) =>
                        <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "creator", name: c.name }}>
                            <div key={c.name}>
                                {c.name}
                            </div>
                        </Link>
                    ) ?? "-"}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Airing Dates
                </span>
                <p className="font-medium text-sm">
                    {formatDateTime(media.releaseDate, { noTime: true })}
                    <br/>
                    {formatDateTime(media.lastAirDate, { noTime: true })}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Origin
                </span>
                <p className="font-medium text-sm">
                    {media.originCountry}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Eps. Duration
                </span>
                <p className="font-medium text-sm">
                    {media.duration ?? "-"}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Seasons
                </span>
                <p className="font-medium text-sm">
                    {media.totalSeasons ?? "-"}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Episodes
                </span>
                <p className="font-medium text-sm">
                    {media.totalEpisodes ?? "-"}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Completion
                </span>
                <p className="font-medium text-sm">
                    {formatMinutes(media.totalEpisodes * media.duration)}
                </p>
            </div>
        </>
    );
};
