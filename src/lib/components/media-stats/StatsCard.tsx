import {List} from "lucide-react";
import {Tooltip} from "@/lib/components/ui/tooltip";
import {StatsList} from "@/lib/components/media-stats/StatsList";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/components/ui/card";


export const StatsCard = ({ data }: { data: any }) => {
    return (
        <Card className="flex flex-col lg:min-w-[220px]">
            <CardHeader>
                <CardTitle className="justify-between max-sm:text-base">
                    <div>{data.title}</div>
                    {data.data &&
                        <Popover>
                            <Tooltip text="Details">
                                <PopoverTrigger>
                                    <List className="w-4 h-4 opacity-50 hover:opacity-100"/>
                                </PopoverTrigger>
                            </Tooltip>
                            <PopoverContent align="end" className="max-h-[500px] overflow-auto">
                                <StatsList
                                    data={data}
                                    asGraph={false}
                                />
                            </PopoverContent>
                        </Popover>
                    }
                </CardTitle>
                <CardDescription>{data.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="grid items-center grid-cols-1">
                <div className="text-3xl font-bold max-sm:text-xl" title={data.value}>
                    {data.value}
                </div>
            </CardContent>
        </Card>
    );
};