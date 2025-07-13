import {NameValuePair} from "@/lib/server/types/base.types";
import {StatsGraph} from "@/lib/components/media-stats/StatsGraph";
import {StatsTable} from "@/lib/components/media-stats/StatsTable";


interface StatsListProps {
    title: string
    asGraph: boolean,
    data: NameValuePair[],
}


export const StatsList = ({ title, data, asGraph }: StatsListProps) => {
    if (asGraph) {
        return (
            <StatsGraph
                title={title}
                dataList={data}
            />
        )
    }

    return (
        <StatsTable
            title={title}
            dataList={data}
        />
    );
};