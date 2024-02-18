import {formatTime} from "@/lib/utils";
import {Separator} from "@/components/ui/separator";
import {Bar, BarChart, XAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend} from "recharts";


const BarGraph = ({ data, formatter }) => {
    const convertedData = data.map(([name, count]) => ({ name, count }));

    const customLabel = ({ x, y, width, height, value }) => {
        const labelYInside = y + 16;
        const labelYOnTop = y - 6;

        return (
            <text x={x + width / 2} y={(height > 20) ? labelYInside : labelYOnTop} textAnchor="middle" className="fw-5"
                  fill={(height > 20) ? "#000000" : "#e2e2e2"}>
                {value}
            </text>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={convertedData} margin={{ bottom: -5 }}>
                <Bar dataKey="count" label={customLabel} isAnimationActive={false} radius={[7, 7, 0, 0]}>
                    {convertedData.map((entry, idx) => <Cell fill={graphColors[idx % graphColors.length]}/>)}
                </Bar>
                <XAxis dataKey="name" stroke="#e2e2e2" scale="band" tickFormatter={formatter}/>
            </BarChart>
        </ResponsiveContainer>
    );
};

const PieGraph = ({ data }) => {
    const convertedData = data.map(([name, count]) => ({ name, count }));

    const customLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
        const displayLabel = percent > 12 / 360;

        return (
            <>
                {displayLabel &&
                    <text x={x} y={y} fill="black" className="fw-5" textAnchor="middle" dominantBaseline="middle">
                        {value}
                    </text>
                }
            </>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie data={convertedData} dataKey="count" stroke="black" isAnimationActive={false} label={customLabel}
                     labelLine={false}>
                    {convertedData.map((entry, idx) => <Cell fill={graphColors[idx % graphColors.length]}/>)}
                </Pie>
                {window.innerWidth <= 490 ?
                    <Legend align="center" layout="horizontal"/>
                    :
                    <Legend align="right" verticalAlign="middle" layout="vertical"/>
                }
            </PieChart>
        </ResponsiveContainer>
    )
};

const StatsCard = ({ name, data, graphType, fmt }) => {
    return (
        <div className="bg-card p-3 rounded-md">
            {name &&
                <>
                    <h5 className="text-lg font-medium">{name}</h5>
                    <Separator/>
                </>
            }
            {graphType === "bar" ?
                <BarGraph data={data} formatter={fmt}/>
                :
                <PieGraph data={data} formatter={fmt}/>
            }
        </div>
    );
};

const graphColors = [
    "#ff4d4d",
    "#ff9966",
    "#ffcc80",
    "#eed6b5",
    "#5db85d",
    "#7fc67f",
    "#a0dca0",
    "#00796b",
    "#4db6ac",
    "#66b2b2",
];

const mediaStats = {
    series: {
        graphType: ["bar", "bar", "pie", "pie", "pie", "pie"],
        formatter: [null, null, null, null, null, null],
    },
    anime: {
        graphType: ["bar", "bar", "pie", "pie", "pie"],
        formatter: [null, null, null, null, null],
    },
    movies: {
        graphType: ["bar", "bar", "pie", "pie", "pie", "pie"],
        formatter: [(value) => formatTime(value), null, null, null, null, null],
    },
    books: {
        graphType: ["bar", "bar", "pie", "pie", "pie"],
        formatter: [null, null, null, null, null],
    },
    games: {
        graphType: ["bar", "bar", "pie", "pie", "pie", "pie"],
        formatter: [(value) => formatTime(value, true), null, null, null, null, null],
    },
}


export const MediaListStats = ({ mediaType, graphData }) => {
    const stats = mediaStats[mediaType]

    return (
        <div className="mt-5">
            <div className="grid grid-cols-12 mb-5 gap-6">
                {graphData.map((graph, idx) =>
                    <div key={graph.name} className="col-span-12 sm:col-span-6">
                        <StatsCard
                            name={graph.name}
                            data={graph.values}
                            graphType={stats.graphType[idx]}
                            fmt={stats.formatter[idx]}
                        />
                    </div>
                )}
            </div>
        </div>
    )
};
