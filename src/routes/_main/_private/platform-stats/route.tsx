import {MediaType} from "@/lib/utils/enums";
import {TabValue} from "@/lib/types/stats.types";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {MediaTypeTabs} from "@/lib/client/media-stats/MediaTypeTabs";
import {DashboardContent} from "@/lib/client/media-stats/DashboardContent";
import {platformStatsOptions} from "@/lib/client/react-query/query-options/query-options";
import {TabHeader} from "@/lib/client/components/user-profile/TabHeader";


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
    const selectedTab: TabValue = filters?.mediaType ?? "overview";
    const apiData = useSuspenseQuery(platformStatsOptions(filters)).data;

    const handleTabChange = async (value: string) => {
        await navigate({ search: value === "overview" ? undefined : { mediaType: value as MediaType } });
    };

    return (
        <PageTitle title="MyLists Statistics" subtitle="Comprehensive media tracking insights">
            <div className="mt-4 mb-8">
                <TabHeader
                    activeTab={selectedTab}
                    setActiveTab={handleTabChange}
                    mediaTypes={apiData.activatedMediaTypes}
                />
            </div>

            <DashboardContent
                data={apiData}
                selectedTab={selectedTab}
            />
        </PageTitle>
    );
}
