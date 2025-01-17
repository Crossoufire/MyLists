import {useCollapse} from "@/hooks/useCollapse";
import {Tooltip} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {Cell, LabelList, Pie, PieChart} from "recharts";
import {getFeelingIcon, getMediaColor} from "@/utils/functions";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const GlobalStats = ({ userData, global }) => {
    const pieData = transformToPieData(global);
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    function transformToPieData(global) {
        const timeSummed = global.time_per_media.reduce((acc, curr) => acc + curr, 0);
        if (timeSummed === 0) return [];

        return global.time_per_media.map((time, idx) => ({
            value: time,
            color: getMediaColor(global.media_types[idx]),
            percent: ((time / timeSummed) * 100).toFixed(0) + "%",
        }));
    }

    const renderCustomLabel = ({ cx, cy, viewBox, value }) => {
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
                                <Pie data={pieData} dataKey="value" outerRadius={80} startAngle={450}
                                     endAngle={90} animationBegin={0} animationDuration={700}>
                                    {pieData.map((entry, idx) => <Cell key={idx} stroke="#0b262b" fill={entry.color}/>)}
                                    <LabelList dataKey="percent" content={renderCustomLabel}/>
                                </Pie>
                            </PieChart>
                        </div>
                    </div>
                    <div className="col-span-12 sm:col-span-7 items-center text-center">
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 font-semibold">
                                <Tooltip text={`${global.total_days} days`}>
                                    <div>
                                        <div className="text-neutral-500 text-lg">Total Time</div>
                                        <div>{global.total_hours} h</div>
                                    </div>
                                </Tooltip>
                                <div>
                                    <div className="text-neutral-500 text-lg">Total Entries</div>
                                    <div>{global.total_media}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 font-semibold">
                                <Tooltip text={`${global.total_rated}/${global.total_media_no_plan_to_x}`}>
                                    <div>
                                        <div className="text-neutral-500 text-lg">% Rated</div>
                                        <div>{global.percent_rated.toFixed(1)} %</div>
                                    </div>
                                </Tooltip>
                                <div>
                                    <div className="text-neutral-500 text-lg">Avg. Rating</div>
                                    <div className="flex items-center justify-center">
                                        {userData.rating_system === "score" ?
                                            `${global.mean_rated.toFixed(2)}/10`
                                            :
                                            getFeelingIcon(global.mean_rated, { size: 18, className: "mt-1" })
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

