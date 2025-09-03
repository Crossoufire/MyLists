import {Cell, Pie, PieChart} from "recharts";
import {Tooltip} from "@/lib/components/ui/tooltip";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {getFeelingIcon, getMediaColor} from "@/lib/utils/functions";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {MediaGlobalSummaryType, UserDataType} from "@/lib/types/query.options.types";


interface GlobalStatsProps {
    userData: UserDataType;
    global: MediaGlobalSummaryType;
}


export const GlobalStats = ({ userData, global }: GlobalStatsProps) => {
    const pieData = transformToPieData(global);
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    function transformToPieData(global: GlobalStatsProps["global"]) {
        return global.mediaTimeDistribution.map((data) => ({
            name: data.name,
            value: data.value,
            color: getMediaColor(data.name),
            percent: ((data.value / global.totalHours) * 100).toFixed(0) + "%",
        }));
    }

    const renderCustomLabel = (props: any) => {
        const { cx, cy, midAngle, outerRadius, startAngle, endAngle, percent } = props;

        // No render if angle <= 20°
        if (Math.abs(endAngle - startAngle) <= 20) return null;

        const RADIAN = Math.PI / 180;
        const radius = (outerRadius / 2) + 8;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="black" fontSize={14} fontWeight={500} textAnchor="middle" dominantBaseline="central">
                {percent}
            </text>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex gap-2">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>Statistics</div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className={contentClasses}>
                <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 sm:col-span-5">
                        <div className="flex items-center justify-center h-[180px]">
                            <PieChart width={180} height={180}>
                                <Pie
                                    data={pieData}
                                    endAngle={450}
                                    startAngle={90}
                                    outerRadius={80}
                                    dataKey={"value"}
                                    labelLine={false}
                                    animationBegin={0}
                                    animationDuration={700}
                                    label={renderCustomLabel}
                                >
                                    {pieData.map((entry, idx) =>
                                        <Cell
                                            key={idx}
                                            stroke="#0b262b"
                                            fill={entry.color}
                                        />
                                    )}
                                </Pie>
                            </PieChart>
                        </div>
                    </div>
                    <div className="col-span-12 sm:col-span-7 items-center text-center">
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 font-semibold">
                                <Tooltip text={`${global.totalDays} days`}>
                                    <div>
                                        <div className="text-neutral-500 text-lg">Total Time</div>
                                        <div>{global.totalHours} h</div>
                                    </div>
                                </Tooltip>
                                <div>
                                    <div className="text-neutral-500 text-lg">Total Entries</div>
                                    <div>{global.totalEntries}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 font-semibold">
                                <Tooltip text={`${global.totalRated}/${global.totalEntriesNoPlan}`}>
                                    <div>
                                        <div className="text-neutral-500 text-lg">% Rated</div>
                                        <div>{global.percentRated.toFixed(1)} %</div>
                                    </div>
                                </Tooltip>
                                <div>
                                    <div className="text-neutral-500 text-lg">Avg. Rating</div>
                                    <div className="flex items-center justify-center">
                                        {userData.ratingSystem === "score" ?
                                            `${global.avgRated.toFixed(2)}/10`
                                            :
                                            getFeelingIcon(global.avgRated, { size: 18, className: "mt-1" })
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
