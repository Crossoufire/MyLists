import {MediaType} from "@/lib/utils/enums";
import {ExtractStatsByType, TabValue} from "@/lib/types/stats.types";
import {OverviewDashboard} from "@/lib/client/media-stats/OverviewDashboard";
import {MediaTypeDashboard} from "@/lib/client/media-stats/MediaTypeDashboard";


interface DashboardContentProps<T extends TabValue> {
    selectedTab: T;
    data: ExtractStatsByType<T extends "overview" ? undefined : MediaType>;
}


export const DashboardContent = <T extends TabValue>({ data, selectedTab }: DashboardContentProps<T>) => {
    if (selectedTab === "overview") {
        return (
            <OverviewDashboard
                stats={data as ExtractStatsByType<undefined>}
            />
        );
    }

    return (
        <MediaTypeDashboard
            stats={data as ExtractStatsByType<MediaType>}
        />
    );
};
