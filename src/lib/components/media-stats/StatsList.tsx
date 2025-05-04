import {StatsGraph} from "@/lib/components/media-stats/StatsGraph";
import {StatsTable} from "@/lib/components/media-stats/StatsTable";


export const StatsList = ({ data, asGraph }: { data: any, asGraph: boolean }) => {
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