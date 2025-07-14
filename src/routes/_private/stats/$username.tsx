import {dataToLoad} from "@/lib/stats";
import {useEffect, useState} from "react";
import {capitalize} from "@/lib/utils/functions";
import {MediaType} from "@/lib/server/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {RatingProvider} from "@/lib/contexts/rating-context";
import {StatsDisplay} from "@/lib/components/media-stats/StatsDisplay";
import {Sidebar, SideBarItem} from "@/lib/components/general/Sidebar";
import {userStatsOptions} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_private/stats/$username")({
    validateSearch: (search) => search as { mediaType?: MediaType },
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { username }, deps: { search } }) => {
        return queryClient.ensureQueryData(userStatsOptions(username, search));
    },
    component: StatsPage,
    errorComponent: () => <div>404</div>,
});


function StatsPage() {
    const filters = Route.useSearch();
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(userStatsOptions(username, filters)).data;
    const statsData = dataToLoad({ apiData, forUser: true });
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
            mediaType: undefined,
            params: { username },
            to: "/stats/$username",
            sidebarTitle: "Overall stats",
            isSelected: filters.mediaType === undefined,
        },
        ...apiData.activatedMediaTypes.map((mt): SideBarItem<typeof selectedData> => ({
            is: "link",
            mediaType: mt,
            params: { username },
            to: "/stats/$username",
            search: { mediaType: mt },
            isSelected: mt === filters.mediaType,
            sidebarTitle: `${capitalize(mt)} stats`,
        })),
        "separator",
        {
            is: "link",
            external: true,
            params: { username },
            to: "/profile/$username",
            sidebarTitle: "User's profile",
        },
        {
            is: "link",
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
                    items={sidebarItems}
                    selectedItem={selectedData}
                    onTabChange={setSelectedData}
                />
                <div>
                    <RatingProvider value={apiData.ratingSystem}>
                        <StatsDisplay statsData={selectedData}/>
                    </RatingProvider>
                </div>
            </div>
        </PageTitle>
    );
}
