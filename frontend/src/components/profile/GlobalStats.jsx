import {useEffect, useState} from "react";
import {Tooltip} from "@/components/ui/tooltip";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {getMediaColor, getRatingValues} from "@/lib/utils";
import {Cell, Pie, PieChart, ResponsiveContainer} from "recharts";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const GlobalStats = ({ userData, global }) => {
    const [chartPie, setChartPie] = useState([]);
    const { isOpen, caret, toggleCollapse } = useCollapse();

    useEffect(() => {
        setChartPie(global.time_per_media.map(value => ({ value })));
    }, [global]);

    const customLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.62;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
        const displayLabel = percent > 15 / 360;

        return (
            <>
                {displayLabel &&
                    <text x={x} y={y} fill="black" className="font-semibold" textAnchor="middle" dominantBaseline="middle">
                        {`${(percent * 100).toFixed(0)}%`}
                    </text>
                }
            </>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="py-1 flex gap-2 items-center">
                        {caret} <div role="button" onClick={toggleCollapse}>Statistics</div>
                    </div>
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent>
                {isOpen &&
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-12 sm:col-span-5">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={chartPie} dataKey="value" stroke="black" isAnimationActive={false}
                                         label={customLabel} labelLine={false} outerRadius={90}>
                                        {global.media_types.map((media, idx) =>
                                            <Cell key={`cell-${idx}`} fill={getMediaColor(media)}/>
                                        )}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="col-span-12 sm:col-span-7 items-center text-center">
                            <div className="flex flex-col gap-6">
                                {userData.add_feeling ?
                                    <>
                                        <div className="grid grid-cols-3 font-semibold">
                                            <Tooltip text={`${global.total_days} days`}>
                                                <div>
                                                    <div className="text-neutral-500 text-lg">Total time</div>
                                                    <div>{global.total_hours} h</div>
                                                </div>
                                            </Tooltip>
                                            <div>
                                                <div className="text-neutral-500 text-lg">Total Media</div>
                                                <div>{global.total_media}</div>
                                            </div>
                                            <Tooltip text={`${global.total_scored}/${global.total_media}`}>
                                                <div>
                                                    <div className="text-neutral-500 text-lg">% Rated</div>
                                                    <div>{global.percent_scored.toFixed(1)} %</div>
                                                </div>
                                            </Tooltip>
                                        </div>
                                        <div className="flex font-semibold items-center justify-around">
                                            {getRatingValues("Feeling").slice(1).reverse().map((f, idx) =>
                                                <div key={idx} className="space-y-2 text-center">
                                                    <div>{f.icon}</div>
                                                    <div>{global.count_per_feeling[idx]}</div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                    :
                                    <>
                                        <div className="grid grid-cols-2 font-semibold">
                                            <Tooltip text={`${global.total_days} days`}>
                                                <div>
                                                    <div className="text-neutral-500 text-lg">Total time</div>
                                                    <div>{global.total_hours} h</div>
                                                </div>
                                            </Tooltip>
                                            <div>
                                                <div className="text-neutral-500 text-lg">Total Media</div>
                                                <div>{global.total_media}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 font-semibold">
                                            <Tooltip text={`${global.total_scored}/${global.total_media}`}>
                                                <div>
                                                    <div className="text-neutral-500 text-lg">% Rated</div>
                                                    <div>{global.percent_scored.toFixed(1)} %</div>
                                                </div>
                                            </Tooltip>
                                            <div>
                                                <div className="text-neutral-500 text-lg">Mean Score</div>
                                                <div>{global.mean_score.toFixed(2)}/10</div>
                                            </div>
                                        </div>
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                }
            </CardContent>
        </Card>
    );
};

