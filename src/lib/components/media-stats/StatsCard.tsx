import {List} from "lucide-react";
import {StatCardData} from "@/lib/types/stats.types";
import {Tooltip} from "@/lib/components/ui/tooltip";
import {StatsTable} from "@/lib/components/media-stats/StatsTable";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/components/ui/card";


export const StatsCard = ({ card }: { card: StatCardData }) => {
    return (
        <Card className="flex flex-col lg:min-w-[220px]">
            <CardHeader>
                <CardTitle className="justify-between max-sm:text-base">
                    <div>{card.title}</div>
                    {card.valuesList &&
                        <Popover>
                            <Tooltip text="Details">
                                <PopoverTrigger>
                                    <List className="w-4 h-4 opacity-50 hover:opacity-100"/>
                                </PopoverTrigger>
                            </Tooltip>
                            <PopoverContent align="end" className="max-h-[500px] overflow-auto">
                                <StatsTable
                                    title={card.title}
                                    dataList={card.valuesList}
                                />
                            </PopoverContent>
                        </Popover>
                    }
                </CardTitle>
                <CardDescription>{card.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="grid items-center grid-cols-1">
                <div className="text-3xl font-bold max-sm:text-xl" title={card.value?.toString() ?? ""}>
                    {card.value}
                </div>
            </CardContent>
        </Card>
    );
};