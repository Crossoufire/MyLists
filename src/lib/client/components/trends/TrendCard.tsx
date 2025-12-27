import {useState} from "react";
import {Calendar, Eye} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {formatDateTime} from "@/lib/utils/functions";
import {TrendsMedia} from "@/lib/types/provider.types";
import {Button} from "@/lib/client/components/ui/button";


export const TrendCard = ({ media }: { media: TrendsMedia }) => {
    const [showOverlay, setShowOverlay] = useState(false);

    const toggleOverlay = (ev: React.MouseEvent) => {
        if (window.matchMedia("(pointer: coarse)").matches) {
            ev.stopPropagation();
            setShowOverlay(!showOverlay);
        }
    };

    return (
        <div className="group relative bg-popover rounded-xl overflow-hidden shadow-md hover:shadow-accent/30 transition-all duration-300">
            <div className="aspect-2/3 w-full relative cursor-pointer" onClick={toggleOverlay}>
                <img
                    src={media.posterPath}
                    alt={media.displayName}
                    className="w-full h-full object-cover"
                />

                <div className="absolute top-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md text-[10px]
                    uppercase font-bold tracking-wider text-muted-foreground border">
                    {media.mediaType}
                </div>

                <div
                    onClick={toggleOverlay}
                    data-active={showOverlay}
                    className="absolute inset-0 bg-neutral-950/95 flex flex-col p-4 text-left items-center justify-center
                    transition-opacity duration-300 opacity-0 pointer-events-none
                    md:group-hover:opacity-100 md:group-hover:pointer-events-auto
                    data-[active=true]:opacity-100 data-[active=true]:pointer-events-auto"
                >
                    <p className="text-muted-foreground text-[13px] line-clamp-6 mb-4 leading-relaxed text-left">
                        {media.overview}
                    </p>

                    <div className="flex gap-2" onClick={(ev) => ev.stopPropagation()}>
                        <Link
                            search={{ external: true }}
                            to="/details/$mediaType/$mediaId"
                            params={{ mediaType: media.mediaType, mediaId: media.apiId }}
                        >
                            <Button variant="emeraldy" size="xs">
                                <Eye className="size-3"/> Details
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="p-3 pt-2 border-t bg-popover relative z-10">
                <h3 className="font-bold text-primary text-sm truncate" title={media.displayName}>
                    <Link
                        search={{ external: true }}
                        to="/details/$mediaType/$mediaId"
                        params={{ mediaType: media.mediaType, mediaId: media.apiId }}
                    >
                        {media.displayName}
                    </Link>
                </h3>
                <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3"/> {formatDateTime(media.releaseDate, { noTime: true })}
          </span>
                </div>
            </div>
        </div>
    );
};