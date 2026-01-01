import {NamedValue} from "@/lib/types/stats.types";
import {MediaType, RatingSystemType} from "@/lib/utils/enums";
import {CustomTooltip} from "@/lib/client/media-stats/DistributionChart";
import {transformRatingToFeeling} from "@/lib/client/media-stats/stats-utils";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {getThemeColor} from "@/lib/utils/colors-and-icons";
import {getFeelingList} from "@/lib/utils/ratings";


interface RatingsChartProps {
    height?: number;
    mediaType: MediaType;
    ratings: NamedValue[];
    ratingSystem: RatingSystemType;
}


export function RatingsChart({ height, ratings, mediaType, ratingSystem }: RatingsChartProps) {
    const chartData = (ratingSystem === RatingSystemType.FEELING) ? transformRatingToFeeling(ratings) : ratings;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">
                    {ratingSystem === RatingSystemType.FEELING ?
                        "Feeling Distribution"
                        :
                        "Rating Distribution"
                    }
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={height ?? 250} className="-ml-6">
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tick={ratingSystem === RatingSystemType.FEELING ?
                                <FeelingTickXAxis/> : { fill: "var(--muted-foreground)", fontSize: 11 }
                            }
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        />
                        <Tooltip
                            content={CustomTooltip}
                            cursor={{ fill: "var(--popover)" }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry) =>
                                <Cell
                                    key={entry.name}
                                    fill={getThemeColor(mediaType)}
                                />
                            )}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}


const FeelingTickXAxis = (props: any) => {
    const { x, y, payload } = props;

    const getFeelingComponent = (value: number) => {
        const feelings = getFeelingList({ size: 18 });
        const feeling = feelings.find((item) => item.label === value.toString());

        return feeling ? feeling.value : "-";
    };

    return (
        <g transform={`translate(${x},${y})`}>
            <foreignObject x="-9" y="2" width="20" height="20">
                {getFeelingComponent(payload.value)}
            </foreignObject>
        </g>
    );
};
