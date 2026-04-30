import React from "react";
import {Calendar} from "lucide-react";
import {MediaType} from "@/lib/utils/enums";
import {getYear} from "@/lib/utils/formating";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {MediaUnderItem} from "@/lib/client/components/media/base/MediaDetailsComps";


type BooksDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["underTitle"]>[number];


export const BooksUnderTitle = ({ media }: BooksDetailsProps<typeof MediaType.BOOKS>) => {
    return (
        <>
            <MediaUnderItem icon={Calendar}>
                {getYear(media.releaseDate)}
            </MediaUnderItem>
        </>
    );
};
