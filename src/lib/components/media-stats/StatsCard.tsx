import {List} from "lucide-react";
import {StatCardData} from "@/lib/types/stats.types";
import {StatsTable} from "@/lib/components/media-stats/StatsTable";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/lib/components/ui/tooltip";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/components/ui/card";


export const StatsCard = ({ card }: { card: StatCardData }) => {
    return (
        <Card className="lg:min-w-[220px]">
            <CardHeader>
                <CardTitle className="max-sm:text-base">
                    {card.title}
                </CardTitle>
                {card.valuesList &&
                    <CardAction>
                        <Popover>
                            <PopoverTrigger>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <List className="size-4 opacity-50 hover:opacity-100"/>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Details
                                    </TooltipContent>
                                </Tooltip>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="max-h-[500px] overflow-auto">
                                <StatsTable
                                    title={card.title}
                                    dataList={card.valuesList}
                                />
                            </PopoverContent>
                        </Popover>
                    </CardAction>
                }
                <CardDescription>{card.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="grid items-center grid-cols-1 h-full">
                <div className="text-3xl font-bold max-sm:text-xl" title={card.value?.toString() ?? ""}>
                    {card.value}
                </div>
            </CardContent>
        </Card>
    );
};
