import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {Bookmark, Calendar, SquareLibrary} from "lucide-react";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type MangaDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["underTitle"]>[number];


export const MangaUnderTitle = ({ media }: MangaDetailsProps<typeof MediaType.MANGA>) => {
    return (
        <>
            <div className="flex items-center gap-1.5">
                <Calendar className="size-4 text-muted-foreground"/>
                <span>{media.releaseDate?.split("-")[0]}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Bookmark className="size-4 text-muted-foreground"/>
                <span>{media.chapters ?? "?"} chapters</span>
            </div>
            <div className="flex items-center gap-1.5">
                <SquareLibrary className="size-4 text-muted-foreground"/>
                <span>{media.volumes ?? "?"} volumes</span>
            </div>
        </>
    );
};
