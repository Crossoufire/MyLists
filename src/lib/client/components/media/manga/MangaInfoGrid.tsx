import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {formatDateTime, formatMinutes} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type MangaDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["infoGrid"]>[number];


export const MangaInfoGrid = ({ mediaType, media }: MangaDetailsProps<typeof MediaType.MANGA>) => {
    return (
        <>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Prod. Status
                </span>
                <p className="font-medium text-sm">
                    {media.prodStatus}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Authored By
                </span>
                <p className="font-medium text-sm wrap-break-word">
                    {media.authors?.slice(0, 3).map((author) =>
                        <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "creator", name: author.name }}>
                            <div key={author.name}>
                                {author.name}
                            </div>
                        </Link>
                    ) ?? "-"}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Published By
                </span>
                <p className="font-medium text-sm wrap-break-word">
                    {media.publishers}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Releasing Dates
                </span>
                <p className="font-medium text-sm">
                    {formatDateTime(media.releaseDate, { noTime: true })}
                    <br/>
                    {formatDateTime(media.endDate, { noTime: true })}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Chapters
                </span>
                <p className="font-medium text-sm">
                    {media.chapters ?? "?"} chapters
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Volumes
                </span>
                <p className="font-medium text-sm">
                    {media.volumes ?? "?"} volumes
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Completion
                </span>
                <p className="font-medium text-sm">
                    {formatMinutes(media.chapters ? media.chapters * 7 : null)}
                </p>
            </div>
        </>
    );
};
