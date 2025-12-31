import {MediaType} from "@/lib/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {useHashTab} from "@/lib/client/hooks/use-hash-tab";
import {TrendGrid} from "@/lib/client/components/trends/TrendGrid";
import {TrendHero} from "@/lib/client/components/trends/TrendHero";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {trendsOptions} from "@/lib/client/react-query/query-options/query-options";
import {TabHeader} from "@/lib/client/components/user-profile/TabHeader";


export const Route = createFileRoute("/_main/_private/trends")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(trendsOptions),
    component: TrendsPage,
});


function TrendsPage() {
    const { seriesTrends, moviesTrends } = useSuspenseQuery(trendsOptions).data;
    const [activeTab, setActiveTab] = useHashTab<"overview" | typeof MediaType.SERIES | typeof MediaType.MOVIES>("overview");

    const allTrends = [...seriesTrends, ...moviesTrends]
        .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    const getFilteredData = () => {
        if (activeTab === MediaType.MOVIES) return moviesTrends;
        if (activeTab === MediaType.SERIES) return seriesTrends;
        return allTrends;
    };

    const filteredTrends = getFilteredData();
    const heroMedia = (activeTab === MediaType.SERIES) ? seriesTrends[0] : moviesTrends[0];

    return (
        <PageTitle title="Week Trends" subtitle="Top Series and Movies trending this week according to TMDB">
            <div className="mt-6">
                <TabHeader
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    mediaTypes={["series", "movies"]}
                />
            </div>

            <div className="mt-6">
                <TrendHero trend={heroMedia}/>
                <TrendGrid data={filteredTrends}/>
            </div>
        </PageTitle>
    );
}
