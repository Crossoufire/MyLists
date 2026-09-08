import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {RotateCw, Star} from "lucide-react";
import {RatingSystemType, TvMediaType} from "@/lib/utils/enums";
import {formatRating} from "@/lib/client/ratings";
import {Button} from "@/lib/client/components/ui/button";
import {tvSeasonsOptions} from "@/lib/client/react-query/query-options/tv-seasons.options";
import {Popover, PopoverContent, PopoverTitle, PopoverTrigger} from "@/lib/client/components/ui/popover";

interface TvSeasonPopoverProps {
    kind: "rating" | "redo";
    value: number | null;
    mediaType: TvMediaType;
    mediaId: number;
    userId: number;
    ratingSystem: RatingSystemType;
}

export const TvSeasonPopover = ({ kind, value, mediaType, mediaId, userId, ratingSystem }: TvSeasonPopoverProps) => {
    const [open, setOpen] = useState(false);
    const query = useQuery({ ...tvSeasonsOptions(mediaType, mediaId, userId), enabled: open });
    if (value === null || (kind === "redo" && value === 0)) return null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="flex items-center gap-1 text-sm" aria-label={kind === "rating" ? "View season ratings" : "View season rewatches"}>
                {kind === "rating" ? <Star size={15} className="text-rating"/> : <RotateCw size={15} className="text-success"/>}
                <span>{kind === "rating" ? formatRating(ratingSystem, value) : `${value} S.`}</span>
            </PopoverTrigger>
            <PopoverContent className="w-64 max-h-80 overflow-y-auto scrollbar-thin p-3">
                <PopoverTitle>{kind === "rating" ? "Season ratings" : "Season rewatches"}</PopoverTitle>
                {query.isPending && <p role="status">Loading seasons…</p>}
                {query.isError && <div role="alert">Could not load seasons. <Button variant="ghost" onClick={() => query.refetch()}>Retry</Button></div>}
                {query.data?.map(s => (
                    <div key={s.season} className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                            <span>Season {s.season}</span>
                            {s.episodes === null && <span className="text-xs text-muted-foreground">Unavailable · excluded</span>}
                        </div>
                        <span className="tabular-nums">{kind === "rating" ? formatRating(ratingSystem, s.rating) : `${s.redo}×`}</span>
                    </div>
                ))}
            </PopoverContent>
        </Popover>
    );
};
