import {MediaType} from "@/lib/utils/enums";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/lib/client/components/ui/badge";
import {ComingNextItem} from "@/lib/types/query.options.types";
import {Hourglass, CheckCircle2, AlertCircle, Clock, Calendar} from "lucide-react";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";
import {formatDateTime, getDaysRemaining, getStatusColor, getTextColor, zeroPad} from "@/lib/utils/functions";


export const ComingNextCard = ({ item, mediaType }: { item: ComingNextItem, mediaType: MediaType }) => {
    const daysRemaining = getDaysRemaining(item.date);
    const isTvShow = mediaType === "series" || mediaType === "anime";

    return (
        <div className="group relative bg-background border rounded-xl overflow-hidden hover:bg-popover/50 transition-all
        duration-300 flex flex-row h-32 max-sm:h-full max-sm:flex-col">
            <div className="relative h-full shrink-0 max-sm:w-full max-sm:h-32">
                <img
                    alt={item.mediaName}
                    src={item.imageCover}
                    className="w-full h-full object-cover"
                />

                <div className="md:hidden absolute top-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md text-[10px]
                    uppercase font-bold tracking-wider text-muted-foreground border">
                    {mediaType}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="hidden md:flex items-center justify-center size-4">
                                <MediaAndUserIcon type={mediaType}/>
                            </span>
                            <Link
                                search={{ external: false }}
                                to="/details/$mediaType/$mediaId"
                                params={{ mediaType, mediaId: item.mediaId }}
                            >
                                <h3 className="font-medium transition-colors line-clamp-1">
                                    {item.mediaName}
                                </h3>
                            </Link>
                        </div>

                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {isTvShow && item.seasonToAir && item.episodeToAir ?
                                <div className="flex items-center gap-2 text-primary">
                                    <span>S{zeroPad(item.seasonToAir)}.E{zeroPad(item.episodeToAir)}</span>
                                    {item.episodeToAir === 1 &&
                                        <span className="text-[10px] text-red-400 px-1.5 rounded border border-red-500">
                                            Premiere
                                        </span>
                                    }
                                </div>
                                :
                                <span className="text-primary">
                                    {mediaType === "games" ? "Release Date" : "Movie Premiere"}
                                </span>
                            }
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        <div className="text-lg font-bold">
                            {formatDateTime(item.date, { noTime: true })}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {item.date ? new Date(item.date).getFullYear() : "-"}
                        </div>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-3 pt-3 border-t">
                    <Badge style={{ background: getStatusColor(item.status), color: getTextColor(getStatusColor(item.status)) }}>
                        {item.status}
                    </Badge>
                    <MediaCountdownBadge
                        days={daysRemaining}
                    />
                </div>
            </div>
        </div>
    );
};


const MediaCountdownBadge = ({ days }: { days: number | null }) => {
    if (days === null) return (
        <div className="flex items-center gap-1 text-primary/90 bg-popover px-2 py-1 rounded text-xs">
            <Hourglass className="size-3"/>
            <span>TBA</span>
        </div>
    );

    if (days < 0) return (
        <div className="flex items-center gap-1 text-primary/90 bg-popover px-2 py-1 rounded text-xs">
            <CheckCircle2 className="size-3"/>
            <span>Released</span>
        </div>
    );

    if (days === 0) return (
        <div className="flex items-center gap-1 text-primary/90 bg-popover px-2 py-1 rounded text-xs font-bold animate-pulse">
            <AlertCircle className="size-3"/>
            <span>TODAY</span>
        </div>
    );

    if (days === 1) return (
        <div className="flex items-center gap-1 text-primary/90 bg-popover px-2 py-1 rounded text-xs font-bold">
            <Clock className="size-3"/>
            <span>TOMORROW</span>
        </div>
    );

    return (
        <div className="flex items-center gap-1 text-primary/90 bg-popover px-2 py-1 rounded text-xs font-medium ">
            <Calendar className="size-3"/>
            <span>In {days} Days</span>
        </div>
    );
};
