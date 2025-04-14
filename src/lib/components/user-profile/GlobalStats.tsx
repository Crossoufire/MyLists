import {Tooltip} from "@/lib/components/ui/tooltip";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {Separator} from "@/lib/components/ui/separator";
import {Cell, LabelList, Pie, PieChart} from "recharts";
import {getFeelingIcon, getMediaColor} from "@/lib/utils/functions";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {MediaGlobalSummaryType, UserDataType} from "@/routes/_private/profile/$username/_header/index";


interface GlobalStatsProps {
    userData: UserDataType;
    global: MediaGlobalSummaryType;
}


export const GlobalStats = ({ userData, global }: GlobalStatsProps) => {
    const pieData = transformToPieData(global);
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    function transformToPieData(global: GlobalStatsProps["global"]) {
        const timeSummed = global.timePerMedia.reduce((acc, curr) => acc + curr, 0);
        if (timeSummed === 0) return [];

        return global.timePerMedia.map((time, idx) => ({
            value: time,
            color: getMediaColor(global.mediaTypes[idx]),
            percent: ((time / timeSummed) * 100).toFixed(0) + "%",
        }));
    }

    const renderCustomLabel = ({ cx, cy, viewBox, value }: any) => {
        // No render if angle is less than |20°|
        if (Math.abs(viewBox.endAngle - viewBox.startAngle) <= 20) return null;

        const RADIAN = Math.PI / 180;
        const radius = (viewBox.outerRadius / 2) + 8;
        const midAngle = (viewBox.startAngle + viewBox.endAngle) / 2;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="black" fontSize={14} fontWeight={500} textAnchor="middle" dominantBaseline="central">
                {value}
            </text>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="py-1 flex gap-2 items-center">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>Statistics</div>
                    </div>
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent className={contentClasses}>
                <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 sm:col-span-5">
                        <div className="flex items-center justify-center h-[180px]">
                            <PieChart width={180} height={180}>
                                <Pie data={pieData} dataKey="value" outerRadius={80} startAngle={450} endAngle={90}
                                     animationBegin={0} animationDuration={700}>
                                    {pieData.map((entry, idx) =>
                                        <Cell key={idx} stroke="#0b262b" fill={entry.color}/>
                                    )}
                                    <LabelList
                                        dataKey="percent"
                                        content={renderCustomLabel}
                                    />
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

