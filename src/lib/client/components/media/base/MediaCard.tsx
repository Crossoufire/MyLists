import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {BlockLink} from "@/lib/client/components/general/BlockLink";


interface MediaCardProps {
    external?: boolean;
    mediaType: MediaType;
    children: React.ReactNode;
    item: {
        mediaId: number;
        mediaName: string;
        imageCover: string;
    };
}


export const MediaCard = ({ children, item, mediaType, external = false }: MediaCardProps) => {
    return (
        <div className="group relative aspect-2/3 h-full rounded-lg border overflow-hidden transition-all duration-300 hover:border-app-accent/50">
            <BlockLink
                search={{ external }}
                to="/details/$mediaType/$mediaId"
                params={{ mediaType, mediaId: item.mediaId }}
            >
                <img
                    alt={item.mediaName}
                    src={item.imageCover}
                    className="object-cover w-full h-full transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent"/>
            </BlockLink>
            {children}
        </div>
    );
};
