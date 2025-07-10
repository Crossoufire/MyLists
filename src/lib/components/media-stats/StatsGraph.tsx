import {useSearch} from "@tanstack/react-router";
import {Separator} from "@/lib/components/ui/separator";
import {RatingSystemType} from "@/lib/server/utils/enums";
import {useRatingSystem} from "@/lib/contexts/rating-context";
import {formatNumberWithKM, getFeelingList, getMediaColor} from "@/lib/utils/functions";
import {Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis} from "recharts";


interface StatsGraphProps {
    title: string;
    dataList: any[];
}


export const StatsGraph = ({ title, dataList }: StatsGraphProps) => {
    return null;

    const ratingSystem = useRatingSystem();
    const filters = useSearch({ strict: false });
    let newDataList = (title === "Rating" && ratingSystem === RatingSystemType.FEELING) ? transformDataList(dataList) : dataList;

    function transformDataList(dataList: any[]) {
        const validValues = [0, 2, 4, 6, 8, 10];
        const validIndices = validValues.map(value => value * 2);
        const transformedList = validValues.map((_, index) => ({ name: index * 2, value: 0 }));
        dataList.forEach((item: any, idx: number) => {
            if (item.value !== 0) {
                const closestValidIndex = validIndices.reduce((prev, curr) => {
                    const prevDiff = Math.abs(idx - prev);
                    const currDiff = Math.abs(idx - curr);
                    if (currDiff < prevDiff || (currDiff === prevDiff && curr < prev)) {
                        return curr;
                    }
                    return prev;
                });

                const validIndexPosition = validIndices.indexOf(closestValidIndex);
                transformedList[validIndexPosition].value += item.value;
            }
        });

        return transformedList;
    }

    const renderCustomLabel = ({ x, y, width, height, value }: any) => {
        if (height < 17 || width < 28) return null;

        const X = x + width / 2;
        const Y = y + height / 2;

        return (
            <text x={X} y={Y} fontWeight={500} textAnchor="middle" dominantBaseline="central" fontSize={height < 20 ? 12 : 14}>
                {formatNumberWithKM(value)}
            </text>
        );
    };

    return (
        <div>
            <div className="text-2xl font-bold">{title} Distribution <Separator/></div>
            <div className="flex items-center justify-center h-[300px] max-sm:h-[200px]">
                <ResponsiveContainer>
                    <BarChart data={newDataList} margin={{ top: 8, right: 15, left: 0, bottom: 5 }}>
                        {title === "Rating" && ratingSystem === RatingSystemType.FEELING ?
                            <XAxis dataKey="name" stroke="#e2e2e2" tick={CustomXAxisTick}/>
                            :
                            <XAxis dataKey="name" stroke="#e2e2e2"/>
                        }
                        <YAxis dataKey="value" stroke="#e2e2e2"/>
                        <RechartsTooltip cursor={{ fill: "#373535" }} content={CustomTooltip}/>
                        <Bar dataKey="value" fill={getMediaColor(filters.mt)}>
                            {newDataList.map((entry, idx) =>
                                <Cell key={idx} fill={getMediaColor(filters.mt ?? entry.name)}/>
                            )}
                            <LabelList dataKey="value" position="center" content={renderCustomLabel}/>
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


interface CustomTooltipProps {
    payload?: any[];
    active?: boolean;
    label?: string | number;
}


export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 p-2 rounded-md">
                <p>Label: {`${label}`}</p>
                <p>Value: {`${formatNumberWithKM(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};


interface CustomXAxisTick {
    x: number;
    y: number;
    payload: any;
}


const CustomXAxisTick = ({ x, y, payload }: CustomXAxisTick) => {
    const getFeelingComponent = (value: any) => {
        const feelings = getFeelingList({ size: 18 });
        const feeling = feelings.find((item) => item.value === value);
        return feeling ? feeling.component : "--";
    };

    return (
        <g transform={`translate(${x},${y})`}>
            <foreignObject x="-9" y="2" width="20" height="20">
                {getFeelingComponent(payload.value)}
            </foreignObject>
        </g>
    );
};
