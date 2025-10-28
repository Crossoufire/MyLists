import {dataToLoad} from "@/lib/client/media-stats";
import {useEffect, useState} from "react";
import {capitalize} from "@/lib/utils/functions";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {RatingProvider} from "@/lib/client/contexts/rating-context";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {MediaType, RatingSystemType} from "@/lib/utils/enums";
import {Sidebar, SideBarItem} from "@/lib/client/components/general/Sidebar";
import {StatsDisplay} from "@/lib/client/components/media-stats/StatsDisplay";
import {platformStatsOptions} from "@/lib/client/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_private/platform-stats")({
    validateSearch: (search) => search as { mediaType?: MediaType },
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => {
        return queryClient.ensureQueryData(platformStatsOptions(search));
    },
    component: GlobalStatsPage,
});


function GlobalStatsPage() {
    const filters = Route.useSearch();
    const apiData = useSuspenseQuery(platformStatsOptions(filters)).data;
    const statsData = dataToLoad({ apiData, forUser: false });
    const [selectedData, setSelectedData] = useState(() => statsData[0]);

    useEffect(() => {
        setSelectedData(statsData[0]);
    }, [filters.mediaType, statsData]);

    if (!selectedData) {
        return null;
    }

    const sidebarItems: SideBarItem<typeof selectedData>[] = [
        ...statsData.map((data): SideBarItem<typeof selectedData> => ({
            is: "tab",
            data: data,
        })),
        "separator",
        {
            is: "link",
            to: "/platform-stats",
            sidebarTitle: "Overall stats",
            isSelected: filters.mediaType === undefined,
            mediaType: undefined,
        },
        ...Object.values(MediaType).map((mt): SideBarItem<typeof selectedData> => ({
            is: "link",
            mediaType: mt,
            to: "/platform-stats",
            search: { mediaType: mt },
            isSelected: mt === filters.mediaType,
            sidebarTitle: `${capitalize(mt)} stats`,
        })),
    ];

    return (
        <PageTitle title="Platform Statistics" subtitle="The statistics from all the users using MyLists.info">
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr] sm:gap-8 mt-4">
                <Sidebar
                    items={sidebarItems}
                    selectedItem={selectedData}
                    onTabChange={setSelectedData}
                />
                <div>
                    <RatingProvider value={RatingSystemType.SCORE}>
                        <StatsDisplay statsData={selectedData}/>
                    </RatingProvider>
                </div>
            </div>
        </PageTitle>
    );
}
