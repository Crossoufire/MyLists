import {ResponsivePie} from "@nivo/pie";
import {useEffect, useState} from "react";
import {pieTheme} from "@/utils/nivoThemes";
import {Tooltip} from "@/components/ui/tooltip";
import {useCollapse} from "@/hooks/useCollapse";
import {Separator} from "@/components/ui/separator";
import {getFeelingIcon, getMediaColor} from "@/utils/functions";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const GlobalStats = ({ userData, global }) => {
    const [pieData, setPieData] = useState([]);
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    useEffect(() => {
        setPieData(transformToPieData(global));
    }, [global]);

    const transformToPieData = (global) => {
        const timeSum = global.time_per_media.reduce((acc, curr) => acc + curr, 0);
        if (timeSum === 0) return [];

        // noinspection JSValidateTypes
        return global.time_per_media.map((time, idx) => ({
            id: idx + 1,
            value: time,
            label: global.media_types[idx],
            color: getMediaColor(global.media_types[idx]),
            total: ((time / timeSum) * 100).toFixed(0) + "%",
        }));
    };

    // noinspection JSValidateTypes
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
                        <div className="flex items-center h-[180px]">
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

