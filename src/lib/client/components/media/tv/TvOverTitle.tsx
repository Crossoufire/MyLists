import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {Badge} from "@/lib/client/components/ui/badge";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type TvDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["overTitle"]>[number];


export const TvOverTitle = ({ media }: TvDetailsProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    const hasNextwork = (media.networks?.length ?? 0) > 0;

    return (
        <>
            <Badge variant="outline" className="text-primary bg-popover">
                {media.prodStatus}
            </Badge>
            {hasNextwork &&
                <>
                    <span className="text-muted-foreground">•</span>
                    {media.networks?.slice(0, 2).map((network) =>
                        <Badge key={network.id} variant="outline" className="text-primary bg-popover">
                            {network.name}
                        </Badge>
                    )}
                </>
            }
        </>
    );
};
