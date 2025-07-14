import {dataToLoad} from "@/lib/stats";
import {useEffect, useState} from "react";
import {capitalize} from "@/lib/utils/functions";
import {MediaType} from "@/lib/server/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {RatingProvider} from "@/lib/contexts/rating-context";
import {StatsDisplay} from "@/lib/components/media-stats/StatsDisplay";
import {Sidebar, SidebarLinkItem} from "@/lib/components/general/Sidebar";
import {userStatsOptions} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_private/stats/$username")({
    validateSearch: (search) => search as { mediaType?: MediaType },
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { username }, deps: { search } }) => {
        return queryClient.ensureQueryData(userStatsOptions(username, search));
    },
    component: StatsPage,
});


function StatsPage() {
    const filters = Route.useSearch();
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(userStatsOptions(username, filters)).data;
    const [selectedTab, setSelectedTab] = useState("Main Statistics");
    const statsData = dataToLoad({ apiData, forUser: true });

    useEffect(() => {
        setSelectedTab(statsData[0].sidebarTitle)
    }, [filters.mediaType]);

    if (statsData.find((data) => data.sidebarTitle === selectedTab) === undefined) {
        return null;
    }

    const mediaLinks: SidebarLinkItem[] = apiData.activatedMediaTypes.map((mt) => ({
        mediaType: mt,
        params: { username },
        to: "/stats/$username",
        search: { mediaType: mt },
        isSelected: mt === filters.mediaType,
        sidebarTitle: `${capitalize(mt)} stats`,
    }));

    const linkItemsSidebar: SidebarLinkItem[] = [
        {
            mediaType: undefined,
            params: { username },
            to: "/stats/$username",
            sidebarTitle: "Overall stats",
            isSelected: filters.mediaType === undefined,
        },
        ...mediaLinks,
        {
            external: true,
            params: { username },
            to: "/profile/$username",
            sidebarTitle: "User's profile",
        },
        {
            external: true,
            params: { username },
            to: "/achievements/$username",
            sidebarTitle: "User's achievements",
        },
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
                            statsData={statsData.find((data) => data.sidebarTitle === selectedTab)!}
                        />
                    </RatingProvider>
                </div>
            </div>
        </PageTitle>
    );
}
