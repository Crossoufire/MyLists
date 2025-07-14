import {dataToLoad} from "@/lib/stats";
import {useEffect, useState} from "react";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Sidebar} from "@/lib/components/general/Sidebar";
import {RatingProvider} from "@/lib/contexts/rating-context";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {MediaType, RatingSystemType} from "@/lib/server/utils/enums";
import {StatsDisplay} from "@/lib/components/media-stats/StatsDisplay";
import {platformStatsOptions} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_private/platform-stats")({
    validateSearch: (search) => search as { mediaType?: MediaType },
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => {
        return queryClient.ensureQueryData(platformStatsOptions(search))
    },
    component: GlobalStatsPage,
});


function GlobalStatsPage() {
    const filters = Route.useSearch();
    const apiData = useSuspenseQuery(platformStatsOptions(filters)).data;
    const [selectedTab, setSelectedTab] = useState("Main Statistics");
    const statsData = dataToLoad({ apiData, forUser: false });

    console.log({ apiData })

    useEffect(() => {
        setSelectedTab(statsData[0].sidebarTitle)
    }, [filters.mediaType]);

    if (statsData.find((data) => data.sidebarTitle === selectedTab) === undefined) {
        return null;
    }

    // const otherStats = apiData.settings.map((s) => ({
    //     sidebarTitle: `${capitalize(s.media_type)} stats`,
    //     to: `/global-stats?mt=${s.media_type}`,
    //     isSelected: s.media_type === filters.mt,
    //     mediaType: s.media_type,
    // }));

    const linkItemsSidebar = [
        {
            sidebarTitle: "Overall stats",
            to: "/platform-stats",
            isSelected: filters.mediaType === undefined,
            mediaType: undefined,
        },
        // ...otherStats,
    ];

    return (
        <PageTitle title="Platform Statistics" subtitle="The statistics from all the users using MyLists.info">
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr] gap-8 mt-4">
                <Sidebar
                    items={statsData}
                    selectedTab={selectedTab}
                    linkItems={linkItemsSidebar}
                    onTabChange={setSelectedTab}
                />
                <div>
                    <RatingProvider value={RatingSystemType.SCORE}>
                        <StatsDisplay
                            statsData={statsData.find((data) => data.sidebarTitle === selectedTab)!}
                        />
                    </RatingProvider>
                </div>
            </div>
        </PageTitle>
    );
}
