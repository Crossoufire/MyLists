import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {formatDateTime, formatMinutes} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type GamesDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["infoGrid"]>[number];


export const GamesInfoGrid = ({ mediaType, media }: GamesDetailsProps<typeof MediaType.GAMES>) => {
    const publishers = media.companies ? media.companies.filter((c) => c.publisher) : [];
    const developers = media.companies ? media.companies.filter((c) => c.developer) : [];

    return (
        <>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Developed By
                </span>
                <p className="font-medium text-sm wrap-break-word">
                    {developers.slice(0, 3).map((dev) =>
                        <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "creator", name: dev.name }}>
                            <div key={dev.name}>
                                {dev.name}
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
                    {publishers.slice(0, 3).map((pub) =>
                        <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "publisher", name: pub.name }}>
                            <div key={pub.name}>
                                {pub.name}
                            </div>
                        </Link>
                    ) ?? "-"}
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
                    Perspective
                </span>
                <p className="font-medium text-sm">
                    {media.playerPerspective ?? "-"}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Engine
                </span>
                <p className="font-medium text-sm">
                    {media.gameEngine ?? "-"}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    HLTB Main
                </span>
                <p className="font-medium text-sm">
                    {media.hltbMainTime ? formatMinutes(media.hltbMainTime * 60, true) : "- h"}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    HLTB Main & Extra
                </span>
                <p className="font-medium text-sm">
                    {media.hltbMainAndExtraTime ? formatMinutes(media.hltbMainAndExtraTime * 60, true) : "- h"}
                </p>
            </div>
            <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    HLTB Total
                </span>
                <p className="font-medium text-sm">
                    {media.hltbTotalCompleteTime ? formatMinutes(media.hltbTotalCompleteTime * 60, true) : "- h"}
                </p>
            </div>
        </>
    );
};
