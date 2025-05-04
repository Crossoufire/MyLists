import {dataToLoad} from "@/lib/stats";
import {useEffect, useState} from "react";
import {capitalize} from "@/lib/utils/functions";
import {MediaType} from "@/lib/server/utils/enums";
import {Sidebar} from "@/lib/components/app/Sidebar";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {RatingProvider} from "@/lib/contexts/rating-context";
import {StatsDisplay} from "@/lib/components/media-stats/StatsDisplay";
import {userStatsOptions} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_private/stats/$username")({
    validateSearch: (search: any) => search as { mediaType: MediaType },
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { username }, deps: { search } }) => {
        return queryClient.ensureQueryData(userStatsOptions(username, search));
    },
    component: StatsPage,
});


function StatsPage() {
    const filters = Route.useSearch();
    const { username } = Route.useParams();
    const [selectedTab, setSelectedTab] = useState("Main Statistics");
    const apiData = useSuspenseQuery(userStatsOptions(username, filters)).data;
    const statsData = dataToLoad({ mediaType: filters.mediaType, apiData: apiData!, forUser: true });

    useEffect(() => {
        setSelectedTab(statsData[0].sidebarTitle)
    }, [filters.mediaType]);

    if (statsData.find((data) => data.sidebarTitle === selectedTab) === undefined) {
        return null;
    }

    // const otherStats = apiData.settings.map(s => ({
    //     mediaType: s.mediaType,
    //     isSelected: s.mediaType === filters.mediaType,
    //     sidebarTitle: `${capitalize(s.mediaType)} stats`,
    //     to: `/stats/${username}?mediaType=${s.mediaType}`,
    // }));

    const linkItemsSidebar = [
        {
            mediaType: undefined,
            to: `/stats/${username}`,
            sidebarTitle: "Overall stats",
            isSelected: filters.mediaType === undefined,
        },
        // ...otherStats,
        { sidebarTitle: "User's profile", to: `/profile/${username}`, external: true },
        { sidebarTitle: "User's achievements", to: `/achievements/${username}`, external: true },
    ];

    return (
        <PageTitle title={`${username} ${capitalize(filters.mediaType) ?? "Overall"} Stats`} subtitle="Detailed stats for the user">
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr] gap-8 mt-4">
                <Sidebar
                    items={statsData}
                    selectedTab={selectedTab}
                    linkItems={linkItemsSidebar}
                    onTabChange={setSelectedTab}
                />
                <div>
                    <RatingProvider value={apiData.ratingSystem}>
                        <StatsDisplay
                            statsData={statsData.find((data) => data.sidebarTitle === selectedTab)}
                        />
                    </RatingProvider>
                </div>
            </div>
        </PageTitle>
    );
}
