import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {formatDateTime, formatMinutes, getLangCountryName} from "@/lib/utils/functions";


type BooksDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["infoGrid"]>[number];


export const BooksInfoGrid = ({ mediaType, media }: BooksDetailsProps<typeof MediaType.BOOKS>) => {
    return (
        <>
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
                    Release Date
                </span>
                <p className="font-medium text-sm">
                    {formatDateTime(media.releaseDate, { noTime: true })}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Language
                </span>
                <p className="font-medium text-sm">
                    {getLangCountryName(media.language, "language")}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Pages
                </span>
                <p className="font-medium text-sm">
                    {media.pages ?? "-"} p.
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Completion
                </span>
                <p className="font-medium text-sm">
                    {formatMinutes(media.pages * 1.7)}
                </p>
            </div>
        </>
    );
};
