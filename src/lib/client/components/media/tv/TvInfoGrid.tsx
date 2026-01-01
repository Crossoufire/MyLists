import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {MediaInfoGridItem} from "@/lib/client/components/media/base/MediaDetailsComps";

import {formatDateTime, formatLocaleName, formatMinutes} from "@/lib/utils/formating";


type TvDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["infoGrid"]>[number];


export const TvInfoGrid = ({ mediaType, media }: TvDetailsProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    const creators = media.createdBy?.split(", ").map((c) => ({ name: c })) || [];

    return (
        <>
            <MediaInfoGridItem label="Prod. Status">
                {media.prodStatus}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Created By">
                {creators.map((c) =>
                    <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "creator", name: c.name }}>
                        <div key={c.name}>
                            {c.name}
                        </div>
                    </Link>
                ) ?? "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Airing Dates">
                {formatDateTime(media.releaseDate, { noTime: true })}
                <br/>
                {formatDateTime(media.lastAirDate, { noTime: true })}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Origin">
                {formatLocaleName(media.originCountry, "region")}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Eps. Duration">
                {media.duration ?? "-"} min
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Total Seasons">
                {media.totalSeasons ?? "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Total Episodes">
                {media.totalEpisodes ?? "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Completion">
                {formatMinutes(media.totalEpisodes * media.duration)}
            </MediaInfoGridItem>
        </>
    );
};
