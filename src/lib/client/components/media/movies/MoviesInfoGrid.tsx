import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {formatCurrency} from "@/lib/client/media-stats/stats-utils";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {formatDateTime, getLangCountryName} from "@/lib/utils/functions";


type MoviesDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["infoGrid"]>[number];


export const MoviesInfoGrid = ({ mediaType, media }: MoviesDetailsProps<typeof MediaType.MOVIES>) => {
    return (
        <>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Directed By
                </span>
                <p className="font-medium text-sm wrap-break-word">
                    {media.directorName ?
                        <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "creator", name: media.directorName }}>
                            {media.directorName}
                        </Link>
                        :
                        "-"
                    }
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Composed By
                </span>
                <p className="font-medium text-sm wrap-break-word">
                    {media.compositorName ?
                        <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "compositor", name: media.compositorName }}>
                            {media.compositorName}
                        </Link>
                        :
                        "-"
                    }
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Release Date
                </span>
                <p className="font-medium text-sm">
                    {formatDateTime(media.releaseDate, { noTime: true })}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Original Lang.
                </span>
                <p className="font-medium text-sm">
                    {getLangCountryName(media.originalLanguage, "language")}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Duration
                </span>
                <p className="font-medium text-sm">
                    {media.duration ?? "-"} min
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Budget
                </span>
                <p className="font-medium text-sm">
                    {formatCurrency(media.budget)}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Revenue
                </span>
                <p className="font-medium text-sm">
                    {formatCurrency(media.revenue)}
                </p>
            </div>
        </>
    );
};
