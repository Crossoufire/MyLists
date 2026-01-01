import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {formatMinutes} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {MediaInfoGridItem} from "@/lib/client/components/media/base/MediaDetailsComps";
import {formatDateTime} from "@/lib/utils/formating";


type MangaDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["infoGrid"]>[number];


export const MangaInfoGrid = ({ mediaType, media }: MangaDetailsProps<typeof MediaType.MANGA>) => {
    return (
        <>
            <MediaInfoGridItem label="Prod. Status">
                {media.prodStatus}
            </MediaInfoGridItem>
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
            <MediaInfoGridItem label="Releasing Dates">
                {formatDateTime(media.releaseDate, { noTime: true })}
                <br/>
                {formatDateTime(media.endDate, { noTime: true })}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Total Chapters">
                {media.chapters ?? "?"} chapters
            </MediaInfoGridItem>
            <MediaInfoGridItem label=" Total Volumes">
                {media.volumes ?? "?"} volumes
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Completion">
                {formatMinutes(media.chapters ? media.chapters * 7 : null)}
            </MediaInfoGridItem>
        </>
    );
};
