import {StatsGraph} from "@/components/media-stats/StatsGraph";
import {StatsTable} from "@/components/media-stats/StatsTable";


export const ListData = ({ data, asGraph }) => {
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