import {getMediaColor} from "@/utils/functions";
import {useParams} from "@tanstack/react-router";
import {Separator} from "@/components/ui/separator";
import {useRatingSystem} from "@/routes/_private/stats/$mediaType/$username.lazy";
import {Bar, BarChart, LabelList, Rectangle, ResponsiveContainer, Scatter, ScatterChart, Tooltip as RechartsTooltip, XAxis, YAxis} from "recharts";


export const StatsGraph = ({ title, dataList }) => {
    const ratingSystem = useRatingSystem().ratingSystem;
    const { mediaType } = useParams({ strict: false });
    let newDataList = (title === "Rating" && ratingSystem === "feeling") ? transformDataList(dataList) : dataList;

    if (title === "Updates Per Month" || title === "Updates (per Month)") {
        newDataList = newDataList.map(item => ({
            name: item.name,
            value: item.value,
            month: parseInt(item.name.split("-")[0]),
            year: parseInt(item.name.split("-")[1]),
        }));
    }

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
            <text x={X} y={Y} fontWeight={500} textAnchor="middle" dominantBaseline="central" fontSize={height < 20 ? 14 : 16}>
                {(value).toFixed(0)}
            </text>
        );
    };

    return (
        <div>
            <div className="text-2xl font-bold">{title} Distribution <Separator/></div>
            <div className="flex items-center justify-center h-[300px] max-sm:h-[200px]">
                <ResponsiveContainer>
                    {title === "Updates Per Month" || title === "Updates (per Month)" ?
                        <HeatMap dataset={newDataList}/>
                        :
                        <BarChart data={newDataList} margin={{ top: 8, right: 15, left: -20, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#e2e2e2"/>
                            <YAxis dataKey="value" stroke="#e2e2e2"/>
                            <Bar dataKey="value" fill={getMediaColor(mediaType)}>
                                <LabelList dataKey="value" position="center" content={renderCustomLabel}/>
                            </Bar>
                        </BarChart>
                    }
                </ResponsiveContainer>

            </div>
        </div>
    );
};


const formatMonth = (month) => {
    switch (month) {
        case 1:
            return "Jan.";
        case 2:
            return "Feb.";
        case 3:
            return "Mar.";
        case 4:
            return "Apr.";
        case 5:
            return "May";
        case 6:
            return "Jun.";
        case 7:
            return "Jul.";
        case 8:
            return "Aug.";
        case 9:
            return "Sep.";
        case 10:
            return "Oct.";
        case 11:
            return "Nov.";
        case 12:
            return "Dec.";
        default:
            return "";
    }
};


const getHeatGroups = (dataset) => {
    const breakpoints = [
        { value: 5, color: "rgb(49, 54, 149)" },
        { value: 10, color: "rgb(116, 173, 209)" },
        { value: 15, color: "rgb(255, 255, 191)" },
        { value: 20, color: "rgb(254, 224, 144)" },
        { value: 25, color: "rgb(253, 174, 97)" },
        { value: 30, color: "rgb(244, 109, 67)" },
        { value: 35, color: "rgb(232,61,53)" },
        { value: 40, color: "rgb(215, 48, 39)" },
    ];
    let remaining = [...dataset];
    const groupedDataset = [];

    breakpoints.forEach(({ value, color }) => {
        groupedDataset.push({ label: `≤ ${value}`, color, data: remaining.filter(d => d.value <= value) });
        remaining = remaining.filter(d => d.value > value);
    });

    if (remaining.length > 0) {
        groupedDataset.push({ label: `> ${breakpoints.pop().value}`, color: "rgb(165, 0, 38)", data: remaining });
    }

    return groupedDataset;
};


const CustomTick = (props) => {
    return <text {...props} y={props.y - 7} fill="#e2e2e2">{formatMonth(props.payload.value)}</text>;
};


const CustomTick2 = (props) => {
    return <text {...props} x={props.x + 45} y={props.y + 8} fill="#e2e2e2">{props.payload.value}</text>;
};


const HeatMap = ({ dataset }) => {
    return (
        <ScatterChart width={515} height={300} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
            <XAxis dataKey="year" domain={[2020, 2024]} type="number" padding={{ right: 90 }} tick={<CustomTick2/>}/>
            <YAxis dataKey="month" tickCount={12} interval={0} padding={{ top: 22 }} domain={[1, 12]} tick={<CustomTick/>}/>
            <RechartsTooltip
                content={({ payload }) => {
                    const data = payload && payload[0] && payload[0].payload;
                    const { month, year, value } = data || {};
                    return (
                        <div className="bg-card p-2 px-4 rounded-md">
                            <p>{`${formatMonth(month)} ${year}`}</p>
                            <p>{value && value.toFixed(0)} updates</p>
                        </div>
                    );
                }}
            />
            {getHeatGroups(dataset).map(group =>
                <Scatter
                    data={group.data}
                    name={group.label}
                    fill={group.color}
                    shape={(props) => <Rectangle {...props} height={22} width={92} x={props.x + 5} y={props.y - 17}/>}
                />
            )}
        </ScatterChart>
    );
};
