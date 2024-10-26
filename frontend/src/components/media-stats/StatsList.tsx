import {StatsGraph} from "@/components/media-stats/StatsGraph";
import {StatsTable} from "@/components/media-stats/StatsTable";


export const StatsList = ({data, asGraph}: StatsListProps) => {
    return (
        <>
            {asGraph ?
                <StatsGraph
                    title={data.title}
                    dataList={data.data}
                />
                :
                <StatsTable
                    title={data.title}
                    dataList={data.data}
                />
            }
        </>
    );
};


interface StatsListProps {
    data: {
        title: string;
        subtitle: string;
        value: string | number;
        data: Array<{
            name: string;
            value: string | number;
        }>;
    };
    asGraph: boolean;
}