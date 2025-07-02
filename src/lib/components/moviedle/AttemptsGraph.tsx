import {CustomGraphTooltip} from "@/lib/components/general/CustomGraphTooltip";
import {Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";


interface AttemptsGraphProps {
    avgAttempts: number;
    attemptsData: Record<string, any>[];
}


export const AttemptsGraph = ({ attemptsData, avgAttempts }: AttemptsGraphProps) => {
    return (
        <ResponsiveContainer>
            <LineChart data={attemptsData} margin={{ left: -40, top: 5, right: 5, bottom: 5 }}>
                <XAxis
                    dataKey="completionTime"
                    tick={{ fill: "#e2e2e2" }}
                />
                <YAxis
                    domain={[0, 6]}
                    tick={{ fill: "#e2e2e2" }}
                    ticks={[0, 1, 2, 3, 4, 5, 6]}
                />
                <Tooltip
                    cursor={{ fill: "#373535" }}
                    content={<CustomGraphTooltip/>}
                />
                <Line
                    dataKey="attempts"
                    dot={{ fill: "#74c4ef", stroke: "#74c4ef", strokeWidth: 1, r: 2 }}
                />
                <ReferenceLine
                    y={avgAttempts}
                    stroke="red"
                    strokeDasharray="6 2"
                />
            </LineChart>
        </ResponsiveContainer>
    );
};
