import {useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {TabValue} from "@/lib/types/stats.types";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {MediaTypeTabs} from "@/lib/client/media-stats/MediaTypeTabs";
import {DashboardContent} from "@/lib/client/media-stats/DashboardContent";
import {platformStatsOptions} from "@/lib/client/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_private/platform-stats")({
    validateSearch: (search) => search as { mediaType?: MediaType },
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => {
        return queryClient.ensureQueryData(platformStatsOptions(search));
    },
    component: PlatformStatsPage,
});


function PlatformStatsPage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const apiData = useSuspenseQuery(platformStatsOptions(filters)).data;
    const [selectedTab, setSelectedTab] = useState<TabValue>(filters?.mediaType ?? "overview");

    const handleTabChange = async (value: string) => {
        setSelectedTab(value as TabValue);
        await navigate({ search: value === "overview" ? undefined : { mediaType: value as MediaType } });
    };

    return (
        <PageTitle title="MyLists Statistics" subtitle="Comprehensive media tracking insights">
            <div className="mt-2">
                <div className="mb-4">
                    <MediaTypeTabs
                        selectedTab={selectedTab}
                        onTabChange={handleTabChange}
                        activatedMediaTypes={apiData.activatedMediaTypes}
                    />
                </div>

                <DashboardContent
                    data={apiData}
                    selectedTab={selectedTab}
                />
            </div>
        </PageTitle>
    );
}
