import {MediaType} from "@/lib/utils/enums";
import {useSuspenseQuery} from "@tanstack/react-query";
import {TrendGrid} from "@/lib/client/components/trends/TrendGrid";
import {TrendHero} from "@/lib/client/components/trends/TrendHero";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {TabHeader, TabItem} from "@/lib/client/components/general/TabHeader";
import {trendsOptions} from "@/lib/client/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_private/trends")({
    validateSearch: (search) => search as { activeTab?: ActiveTab },
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(trendsOptions),
    component: TrendsPage,
});


type ActiveTab = "all" | typeof MediaType.SERIES | typeof MediaType.MOVIES | typeof MediaType.GAMES;


function TrendsPage() {
    const { activeTab = "all" } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    const { seriesTrends, moviesTrends, gamesTrends } = useSuspenseQuery(trendsOptions).data;

    const setActiveTab = (newTab: ActiveTab) => {
        console.log({ newTab });
        void navigate({ search: (prev) => ({ ...prev, activeTab: newTab }) });
    };

    const allTrends = [...seriesTrends, ...moviesTrends, ...gamesTrends]
        .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    const getFilteredData = () => {
        if (activeTab === MediaType.GAMES) return gamesTrends;
        if (activeTab === MediaType.MOVIES) return moviesTrends;
        if (activeTab === MediaType.SERIES) return seriesTrends;
        return allTrends;
    };

    const getHeroMedia = () => {
        if (activeTab === MediaType.GAMES) return gamesTrends[0];
        if (activeTab === MediaType.SERIES) return seriesTrends[0];
        return moviesTrends[0];
    }

    const heroMedia = getHeroMedia();
    const filteredTrends = getFilteredData();

    const mediaTabs: TabItem<ActiveTab>[] = [
        {
            id: "all",
            label: "All",
            isAccent: true,
            icon: <MainThemeIcon size={15} type="all"/>,
        },
        ...[MediaType.SERIES, MediaType.MOVIES, MediaType.GAMES].map((mediaType) => ({
            id: mediaType,
            label: mediaType,
            icon: <MainThemeIcon size={15} type={mediaType}/>,
        })),
    ];

    return (
        <PageTitle title="Week Trends" subtitle="Top Series, Movies and Games trending this week">
            <TabHeader
                tabs={mediaTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <div className="mt-4">
                <TrendHero trend={heroMedia}/>
                <TrendGrid data={filteredTrends}/>
            </div>
        </PageTitle>
    );
}
