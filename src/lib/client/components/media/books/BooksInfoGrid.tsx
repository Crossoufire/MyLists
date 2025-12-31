import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {MediaInfoGridItem} from "@/lib/client/components/media/base/MediaDetailsComps";
import {formatDateTime, formatMinutes, getLangCountryName} from "@/lib/utils/functions";


type BooksDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["infoGrid"]>[number];


export const BooksInfoGrid = ({ mediaType, media }: BooksDetailsProps<typeof MediaType.BOOKS>) => {
    return (
        <>
            <MediaInfoGridItem label="Authored By">
                {media.authors?.slice(0, 3).map((author) =>
                    <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "creator", name: author.name }}>
                        <div key={author.name}>
                            {author.name}
                        </div>
                    </Link>
                ) ?? "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Published By">
                {media.publishers ?? "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Release Date">
                {formatDateTime(media.releaseDate, { noTime: true })}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Language">
                {getLangCountryName(media.language, "language")}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Total Pages">
                {media.pages ?? "-"} p.
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Completion">
                {formatMinutes(media.pages * 1.7)}
            </MediaInfoGridItem>
        </>
    );
};
