import {ResponsivePie} from "@nivo/pie";
import {pieTheme} from "@/lib/constants";
import {useEffect, useState} from "react";
import {Tooltip} from "@/components/ui/tooltip";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {formatTimeTo, getFeelingValues, getMediaColor} from "@/lib/utils";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const GlobalStats = ({ userData, globalStats }) => {
    const [pieData, setPieData] = useState([]);
    const { isOpen, caret, toggleCollapse } = useCollapse();

    useEffect(() => {
        setPieData(transformToPieData(globalStats))
    }, [globalStats]);

    const transformToPieData = (globalStats) => {
        const summedTime = globalStats.time_per_media.reduce((acc, curr) => acc + curr[0], 0);
        if (summedTime === 0) {
            return [];
        }

        return globalStats.time_per_media.map((data, idx) => ({
            id: idx + 1,
            value: data[0],
            label: data[1],
            color: getMediaColor(data[1]),
            total: ((data[0]/summedTime) * 100).toFixed(0) + "%",
        }));
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
                            <div className="flex items-center h-[200px]">
                                <ResponsivePie
                                    data={pieData}
                                    borderWidth={1}
                                    theme={pieTheme}
                                    isInteractive={false}
                                    arcLabelsSkipAngle={20}
                                    enableArcLinkLabels={false}
                                    arcLabelsRadiusOffset={0.65}
                                    arcLabelsTextColor={"#121212"}
                                    colors={{ datum: "data.color" }}
                                    arcLabel={(data) => data.data.total}
                                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                    borderColor={{ from: "color", modifiers: [["darker", 3]] }}
                                />
                            </div>
                        </div>
                        <div className="col-span-12 sm:col-span-7 items-center text-center">
                            <div className="flex flex-col gap-6">
                                {userData.rating_system === "feeling" ?
                                    <GlobalStatsWithFeeling globalStats={globalStats}/>
                                    :
                                    <GlobalStatsWithScore globalStats={globalStats}/>
                                }
                            </div>
                        </div>
                    </div>
                }
            </CardContent>
        </Card>
    );
};


const GlobalStatsWithScore = ({ globalStats }) => {
    return (
        <>
            <div className="grid grid-cols-2 font-semibold">
                <Tooltip text={`${formatTimeTo("days", globalStats.total_time_spent)} days`}>
                    <div>
                        <div className="text-neutral-500 text-lg">Total Time</div>
                        <div>{formatTimeTo("hours", globalStats.total_time_spent)} h</div>
                    </div>
                </Tooltip>
                <div>
                    <div className="text-neutral-500 text-lg">Total Entries</div>
                    <div>{globalStats.total_media}</div>
                </div>
            </div>
            <div className="grid grid-cols-2 font-semibold">
                <Tooltip text={`${globalStats.total_rated} / ${globalStats.total_media}`}>
                    <div>
                        <div className="text-neutral-500 text-lg">% Rated</div>
                        <div>{globalStats.percent_rated.toFixed(1)} %</div>
                    </div>
                </Tooltip>
                <div>
                    <div className="text-neutral-500 text-lg">Avg. Rating</div>
                    <div>{globalStats.avg_rating.toFixed(2)}/10</div>
                </div>
            </div>
        </>
    )
};


const GlobalStatsWithFeeling = ({ globalStats }) => {
    return (
        <>
            <div className="grid grid-cols-3 font-semibold">
                <Tooltip text={`${formatTimeTo("days", globalStats.total_time_spent)} days`}>
                    <div>
                        <div className="text-neutral-500 text-lg">Total Time</div>
                        <div>{formatTimeTo("hours", globalStats.total_time_spent)} h</div>
                    </div>
                </Tooltip>
                <div>
                    <div className="text-neutral-500 text-lg">Total Entries</div>
                    <div>{globalStats.total_media}</div>
                </div>
                <Tooltip text={`${globalStats.total_rated} / ${globalStats.total_media}`}>
                    <div>
                        <div className="text-neutral-500 text-lg">% Rated</div>
                        <div>{globalStats.percent_rated.toFixed(1)} %</div>
                    </div>
                </Tooltip>
            </div>
            <div className="flex font-semibold items-center justify-around">
                {getFeelingValues().slice(1).reverse().map(feelIcon =>
                    <div key={feelIcon.value} className="flex flex-col gap-1 items-center">
                        <div>{feelIcon.icon}</div>
                        <div>{globalStats.count_per_rating[feelIcon.value * 4]}</div>
                    </div>
                )}
            </div>
        </>
    )
};