import React from "react";
import {LoaderCircle} from "lucide-react";
import {Card} from "@/lib/components/ui/card";
import {MediaType} from "@/lib/server/utils/enums";
import {JobDetail} from "@/lib/server/types/base.types";
import {BlockLink} from "@/lib/components/app/BlockLink";


interface MediaCardProps {
    item: JobDetail;
    isPending?: boolean;
    mediaType: MediaType;
    children: React.ReactNode;
}


export const MediaCard = ({ children, item, mediaType, isPending = false }: MediaCardProps) => {
    return (
        <Card className="rounded-lg">
            <div className="relative aspect-[2/3] rounded-lg border border-black">
                <BlockLink to="/details/$mediaType/$mediaId" params={{ mediaType, mediaId: item.mediaId }}>
                    <img
                        alt={item.mediaName}
                        src={item.imageCover}
                        className={"object-cover w-full h-full rounded-lg"}
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
