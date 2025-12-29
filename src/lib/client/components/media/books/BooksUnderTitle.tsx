import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {Calendar, BookOpen} from "lucide-react";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type BooksDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["underTitle"]>[number];


export const BooksUnderTitle = ({ media }: BooksDetailsProps<typeof MediaType.BOOKS>) => {
    return (
        <>
            <div className="flex items-center gap-1.5">
                <Calendar className="size-4 text-muted-foreground"/>
                <span>{media.releaseDate?.split("-")[0]}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <BookOpen className="size-4 text-muted-foreground"/>
                <span>{media.pages} pages</span>
            </div>
        </>
    );
};
