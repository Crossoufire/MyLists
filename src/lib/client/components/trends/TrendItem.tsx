import {Link} from "@tanstack/react-router";
import {formatDateTime} from "@/lib/utils/functions";
import {TrendItemType} from "@/lib/types/query.options.types";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {CalendarDays} from "lucide-react";


interface TrendItemProps {
    item: TrendItemType;
}


export const TrendItem = ({ item }: TrendItemProps) => {
    const { apiId, posterPath, displayName, mediaType, releaseDate, overview } = item;

    return (
        <div className="bg-card text-card-foreground rounded-md shadow-sm flex flex-col border h-full">
            <div className="grid grid-cols-12">
                <div className="col-span-5">
                    <Link to="/details/$mediaType/$mediaId" search={{ external: true }} params={{ mediaType, mediaId: apiId }}>
                        <img
                            src={posterPath}
                            alt={displayName}
                            className="rounded-tl-md rounded-bl-md h-full"
                        />
                    </Link>
                </div>
                <div className="col-span-7 px-4 mt-5">
                    <Link to="/details/$mediaType/$mediaId" search={{ external: true }} params={{ mediaType: mediaType, mediaId: apiId }}>
                        <h3 className="text-lg line-clamp-2 leading-none font-semibold flex flex-col items-start">
                            {displayName}
                        </h3>
                    </Link>
                    <MutedText italic={false} className="flex gap-2 items-center text-sm mt-3">
                        <CalendarDays className="size-4"/> {formatDateTime(releaseDate, { noTime: true })}
                    </MutedText>
                    <div className="line-clamp-5 mt-4 text-sm text-neutral-300 leading-relaxed text-pretty">
                        {overview}
                    </div>
                </div>
            </div>
        </div>
    );
};