import {globalStatsOptions} from "@/api";
import {useEffect, useState} from "react";
import {capitalize} from "@/utils/functions";
import {Sidebar} from "@/components/app/Sidebar";
import {PageTitle} from "@/components/app/PageTitle";
import {useSuspenseQuery} from "@tanstack/react-query";
import {RatingProvider} from "@/providers/RatingProvider";
import {createLazyFileRoute} from "@tanstack/react-router";
import {dataToLoad} from "@/components/media-stats/statsFormatter";
import {StatsDisplay} from "@/components/media-stats/StatsDisplay";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/global-stats")({
    component: GlobalStatsPage,
});


function GlobalStatsPage() {
    const filters = Route.useSearch();
    const apiData = useSuspenseQuery(globalStatsOptions(filters)).data;
    const [selectedTab, setSelectedTab] = useState("Main Statistics");
    const statsData = dataToLoad(filters.mt, apiData.stats);

    useEffect(() => {
        setSelectedTab(statsData[0].sidebarTitle);
    }, [filters.mt]);

    if (statsData.find(data => data.sidebarTitle === selectedTab) === undefined) {
        return null;
    }

    const otherStats = apiData.settings.map(s => ({
        sidebarTitle: `${capitalize(s.media_type)} stats`,
        to: `/global-stats?mt=${s.media_type}`,
        isSelected: s.media_type === filters.mt,
        mediaType: s.media_type,
    }));

    const linkItemsSidebar = [
        {
            sidebarTitle: "Overall stats",
            to: "/global-stats",
            isSelected: filters.mt === undefined,
            mediaType: undefined,
        },
        ...otherStats,
    ];

    return (
        <PageTitle title="Global Statistics" subtitle="The global statistics of all the users using MyLists.info">
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr] gap-8 mt-4">
                <Sidebar
                    items={statsData}
                    selectedTab={selectedTab}
                    linkItems={linkItemsSidebar}
                    onTabChange={setSelectedTab}
                />
                <div>
                    <RatingProvider value={{ ratingSystem: "score" }}>
                        <StatsDisplay statsData={statsData.find((data) => data.sidebarTitle === selectedTab)}/>
                    </RatingProvider>
                </div>
            </div>
        </PageTitle>
    );
}
