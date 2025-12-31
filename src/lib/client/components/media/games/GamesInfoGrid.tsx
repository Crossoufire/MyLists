import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {formatDateTime, formatMinutes} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";

import {MediaInfoGridItem} from "@/lib/client/components/media/base/MediaDetailsComps";


type GamesDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["infoGrid"]>[number];


export const GamesInfoGrid = ({ mediaType, media }: GamesDetailsProps<typeof MediaType.GAMES>) => {
    const publishers = media.companies ? media.companies.filter((c) => c.publisher) : [];
    const developers = media.companies ? media.companies.filter((c) => c.developer) : [];

    return (
        <>
            <MediaInfoGridItem label="Developed By">
                {developers.slice(0, 3).map((dev) =>
                    <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "creator", name: dev.name }}>
                        <div key={dev.name}>
                            {dev.name}
                        </div>
                    </Link>
                ) ?? "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Published By">
                {publishers.slice(0, 3).map((pub) =>
                    <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "publisher", name: pub.name }}>
                        <div key={pub.name}>
                            {pub.name}
                        </div>
                    </Link>
                ) ?? "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Release Date">
                {formatDateTime(media.releaseDate, { noTime: true })}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Perspective">
                {media.playerPerspective ?? "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="Engine">
                {media.gameEngine ?? "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="HLTB Main">
                {media.hltbMainTime ? formatMinutes(media.hltbMainTime * 60, true) : "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="HLTB Main & Extra">
                {media.hltbMainAndExtraTime ? formatMinutes(media.hltbMainAndExtraTime * 60, true) : "-"}
            </MediaInfoGridItem>
            <MediaInfoGridItem label="HLTB 100%">
                {media.hltbTotalCompleteTime ? formatMinutes(media.hltbTotalCompleteTime * 60, true) : "-"}
            </MediaInfoGridItem>
        </>
    );
};
