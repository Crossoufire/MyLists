import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {Calendar, BookOpen} from "lucide-react";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {MediaUnderItem} from "@/lib/client/components/media/base/MediaDetailsComps";
import {getYear} from "@/lib/utils/formating";


type BooksDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["underTitle"]>[number];


export const BooksUnderTitle = ({ media }: BooksDetailsProps<typeof MediaType.BOOKS>) => {
    return (
        <>
            <MediaUnderItem icon={Calendar}>
                {getYear(media.releaseDate)}
            </MediaUnderItem>
            <MediaUnderItem icon={BookOpen}>
                {media.pages ?? "-"} pages
            </MediaUnderItem>
        </>
    );
};
