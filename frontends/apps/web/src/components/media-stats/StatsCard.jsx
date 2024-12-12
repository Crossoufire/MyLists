import {List} from "lucide-react";
import {cn} from "@/utils/functions";
import {Tooltip} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {StatsList} from "@/components/media-stats/StatsList";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";


export const StatsCard = ({ data, otherData }) => {
    return (
        <Card className="flex flex-col lg:min-w-[220px]">
            <CardHeader>
                <CardTitle className="justify-between max-sm:text-base">
                    <div>{data.title}</div>
                    {(data.data && !otherData) &&
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
            <CardContent className={cn("grid items-center", otherData ? "grid-cols-[1fr_0fr_1fr]" : "grid-cols-1")}>
                <div className={cn("text-3xl font-bold max-sm:text-xl", otherData && "text-2xl text-center flex items-center justify-center")} title={data.value}>
                    {data.value}
                </div>
                {otherData &&
                    <>
                        <Separator variant="vertical" className="mx-3 h-full bg-neutral-600"/>
                        <div className="text-2xl font-bold max-sm:text-xl text-center flex items-center justify-center" title={otherData.value}>
                            {typeof otherData.value === "number" || otherData.title === "Total Budgets" ||
                            otherData.title === "Total Revenue" ?
                                <span className={otherData.value > data.value ? "text-green-400" : "text-red-400"}>
                                    {otherData.value}
                                </span>
                                :
                                otherData.value
                            }
                        </div>
                    </>
                }
            </CardContent>
        </Card>
    );
};