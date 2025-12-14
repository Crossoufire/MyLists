import React from "react";
import {LoaderCircle} from "lucide-react";
import {MediaType} from "@/lib/utils/enums";
import {Card} from "@/lib/client/components/ui/card";
import {BlockLink} from "@/lib/client/components/general/BlockLink";


interface MediaCardProps {
    isPending?: boolean;
    mediaType: MediaType;
    children: React.ReactNode;
    item: {
        mediaId: number;
        mediaName: string;
        imageCover: string;
    };
}


export const MediaCard = ({ children, item, mediaType, isPending = false }: MediaCardProps) => {
    return (
        <Card className="rounded-lg py-0 border-none" style={{ viewTransitionName: `media-cover-${item.mediaId}` }}>
            <div className="relative aspect-2/3 h-full rounded-lg border border-black">
                <BlockLink to="/details/$mediaType/$mediaId" params={{ mediaType, mediaId: item.mediaId }}>
                    <img
                        alt={item.mediaName}
                        src={item.imageCover}
                        className="object-cover w-full h-full rounded-lg"
                    />
                </BlockLink>
                {isPending &&
                    <div className="z-50 absolute h-full w-full top-[50%] left-[50%] transform -translate-x-1/2
                    -translate-y-1/2 flex justify-center items-center bg-black opacity-80 rounded-md">
                        <LoaderCircle className="h-6 w-6 animate-spin"/>
                    </div>
                }
                {children}
            </div>
        </Card>
    );
};
