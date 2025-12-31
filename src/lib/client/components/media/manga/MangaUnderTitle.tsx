import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {getYear} from "@/lib/utils/functions";
import {Bookmark, Calendar, SquareLibrary} from "lucide-react";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {MediaUnderItem} from "@/lib/client/components/media/base/MediaDetailsComps";


type MangaDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["underTitle"]>[number];


export const MangaUnderTitle = ({ media }: MangaDetailsProps<typeof MediaType.MANGA>) => {
    return (
        <>
            <MediaUnderItem icon={Calendar}>
                {getYear(media.releaseDate)}
            </MediaUnderItem>
            <MediaUnderItem icon={Bookmark}>
                {media.chapters ?? "?"} chapters
            </MediaUnderItem>
            <MediaUnderItem icon={SquareLibrary}>
                {media.volumes ?? "?"} volumes
            </MediaUnderItem>
        </>
    );
};
