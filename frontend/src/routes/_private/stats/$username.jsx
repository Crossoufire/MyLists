import {statsOptions} from "@/api";
import {useEffect, useState} from "react";
import {capitalize} from "@/utils/functions";
import {Sidebar} from "@/components/app/Sidebar";
import {PageTitle} from "@/components/app/PageTitle";
import {useSuspenseQuery} from "@tanstack/react-query";
import {RatingProvider} from "@/providers/RatingProvider";
import {createFileRoute, redirect} from "@tanstack/react-router";
import {dataToLoad} from "@/components/media-stats/statsFormatter";
import {StatsDisplay} from "@/components/media-stats/StatsDisplay";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/stats/$username")({
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { username }, deps: { search } }) => {
        try {
            await queryClient.ensureQueryData(statsOptions(username, search));
        }
        catch (error) {
            if (error.status === 403) {
                throw redirect({ to: "/", search: { message: "You need to be logged-in to view these stats" } });
            }
        }
    },
    component: StatsPage,
});


function StatsPage() {
    const filters = Route.useSearch();
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(statsOptions(username, filters)).data;
    const [selectedTab, setSelectedTab] = useState("Main Statistics");
    const statsData = dataToLoad(filters.mt, apiData.stats, true);

    useEffect(() => {
        setSelectedTab(statsData[0].sidebarTitle);
    }, [filters.mt]);

    if (statsData.find(data => data.sidebarTitle === selectedTab) === undefined) {
        return null;
    }

    const otherStats = apiData.settings.map(s => ({
        sidebarTitle: `${capitalize(s.media_type)} stats`,
        to: `/stats/${username}?mt=${s.media_type}`,
        isSelected: s.media_type === filters.mt,
        mediaType: s.media_type,
    }));

    const linkItemsSidebar = [
        {
            sidebarTitle: "Overall stats",
            to: `/stats/${username}`,
            isSelected: filters.mt === undefined,
            mediaType: undefined,
        },
        ...otherStats,
        { sidebarTitle: "User's profile", to: `/profile/${username}`, external: true },
        { sidebarTitle: "User's achievements", to: `/achievements/${username}`, external: true },
    ];

    return (
        <PageTitle title={`${username} ${capitalize(filters.mt) ?? "Overall"} Stats`} subtitle="Detailed stats for the user">
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr] gap-8 mt-4">
                <Sidebar
                    items={statsData}
                    selectedTab={selectedTab}
                    linkItems={linkItemsSidebar}
                    onTabChange={setSelectedTab}
                />
                <div>
                    <RatingProvider value={{ ratingSystem: apiData.stats.rating_system }}>
                        <StatsDisplay statsData={statsData.find(data => data.sidebarTitle === selectedTab)}/>
                    </RatingProvider>
                </div>
            </div>
        </PageTitle>
    );
}
