import React from "react";
import {capitalize} from "@/lib/utils/functions";
import {TopAffinity} from "@/lib/types/stats.types";
import {Badge} from "@/lib/client/components/ui/badge";
import {CircleHelp, Heart, Play, Star} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";
import {Card, CardAction, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


interface TopAffinityCardProps {
    title: string;
    topAffinity: TopAffinity;
}


export const TopAffinityCard = ({ title, topAffinity }: TopAffinityCardProps) => (
    <Card>
        <CardHeader>
            <CardTitle>
                Top {title}
            </CardTitle>
            <CardAction>
                <AffinityPopover/>
            </CardAction>
        </CardHeader>
        <CardContent>
            <div className="space-y-2 overflow-y-auto max-h-67">
                {topAffinity.length === 0 ?
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No data available
                    </p>
                    :
                    topAffinity.map((item, idx) =>
                        <div key={item.name} className="flex items-center justify-between rounded-md px-2 py-1.5
                        transition-colors hover:bg-muted/50">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="w-5 text-sm text-muted-foreground">
                                    {idx + 1}.
                                </span>
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate text-sm font-medium">
                                        {capitalize(item.name)}
                                    </span>
                                    {item.metadata &&
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Play className="size-3"/>
                                            {item.metadata.entriesCount}
                                        </span>
                                            <span className="flex items-center gap-1">
                                            <Heart className="size-3 text-red-500"/>
                                                {item.metadata.favoriteCount}
                                        </span>
                                            <span className="flex items-center gap-1">
                                            <Star className="size-3 fill-yellow-500/20 text-yellow-500"/>
                                                {item.metadata.avgRating}
                                        </span>
                                        </div>
                                    }
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant="secondary" className="ml-2 shrink-0">
                                    {item.value}
                                </Badge>
                            </div>
                        </div>
                    )
                }
            </div>
        </CardContent>
    </Card>
);


const AffinityPopover = () => {
    return (
        <Popover>
            <PopoverTrigger className="opacity-70 hover:opacity-100">
                <CircleHelp className="size-4"/>
            </PopoverTrigger>
            <PopoverContent className="w-75">
                <div className="mb-3 flex items-center gap-2 font-semibold">
                    Affinity Score <span className="-ml-1 text-sm text-red-400">*</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-3">
                    <p>A score (0-10) representing the preference for a category based on:</p>
                    <ul className="space-y-2 list-none border-l-2 border-muted pl-3">
                        <li>
                            <span className="font-medium text-foreground block">
                                1. Ratings
                            </span>
                            How much higher the rated items are compared to the average.
                        </li>
                        <li>
                            <span className="font-medium text-foreground block">
                                2. Favorites
                            </span>
                            Multiplicative bonus points for entries marked as favorites.
                        </li>
                        <li>
                            <span className="font-medium text-foreground block">
                                3. Volume
                            </span>
                            The more watch or read, the more accurate the score.
                        </li>
                    </ul>
                    <p className="italic text-xs pt-2 border-t">
                        <span className="text-sm text-red-400">*</span>{" "}
                        Requires at least 3 entries to appear.
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
};
