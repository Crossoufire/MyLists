import {useSearch} from "@tanstack/react-router";
import {Separator} from "@/components/ui/separator";
import {useRatingSystem} from "@/providers/RatingProvider";
import {formatNumberWithKM, getFeelingList, getMediaColor} from "@/utils/functions";
import {Bar, BarChart, LabelList, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis} from "recharts";


export const StatsGraph = ({ title, dataList }) => {
    const ratingSystem = useRatingSystem().ratingSystem;
    const filters = useSearch({ strict: false });
    let newDataList = (title === "Rating" && ratingSystem === "feeling") ? transformDataList(dataList) : dataList;

    function transformDataList(dataList) {
        const validValues = [0, 2, 4, 6, 8, 10];
        const validIndices = validValues.map(value => value * 2);
        const transformedList = validValues.map((value, index) => ({ name: index * 2, value: 0 }));
        dataList.forEach((item, idx) => {
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

    const renderCustomLabel = ({ x, y, width, height, value }) => {
        if (height < 17 || width < 20) return null;

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
                    <BarChart data={newDataList} margin={{ top: 8, right: 15, left: -20, bottom: 5 }}>
                        {title === "Rating" && ratingSystem === "feeling" ?
                            <XAxis dataKey="name" stroke="#e2e2e2" tick={<CustomXAxisTick/>}/>
                            :
                            <XAxis dataKey="name" stroke="#e2e2e2"/>
                        }
                        <YAxis dataKey="value" stroke="#e2e2e2"/>
                        <RechartsTooltip content={<CustomTooltip/>}/>
                        <Bar dataKey="value" fill={getMediaColor(filters.mt)}>
                            <LabelList dataKey="value" position="center" content={renderCustomLabel}/>
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


const CustomTooltip = ({ active, payload, label }) => {
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


const CustomXAxisTick = ({ x, y, payload }) => {
    const getFeelingComponent = (value) => {
        const feelings = getFeelingList(18);
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
