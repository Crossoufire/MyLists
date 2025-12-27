import {MediaType} from "@/lib/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {useHashTab} from "@/lib/client/hooks/use-hash-tab";
import {TrendGrid} from "@/lib/client/components/trends/TrendGrid";
import {TrendHero} from "@/lib/client/components/trends/TrendHero";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {trendsOptions} from "@/lib/client/react-query/query-options/query-options";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs";


export const Route = createFileRoute("/_main/_private/trends")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(trendsOptions),
    component: TrendsPage,
});


function TrendsPage() {
    const { seriesTrends, moviesTrends } = useSuspenseQuery(trendsOptions).data;
    const [selectedTab, handleTabChange] = useHashTab<"overview" | typeof MediaType.SERIES | typeof MediaType.MOVIES>("overview");

    const allTrends = [...seriesTrends, ...moviesTrends].sort((a, b) => b.apiId - a.apiId);

    const getFilteredData = () => {
        if (selectedTab === MediaType.MOVIES) return moviesTrends;
        if (selectedTab === MediaType.SERIES) return seriesTrends;
        return allTrends;
    };

    const filteredTrends = getFilteredData();
    const heroMedia = (selectedTab === MediaType.SERIES) ? seriesTrends[0] : moviesTrends[0];

    return (
        <PageTitle title="Week Trends" subtitle="Top Series and Movies trending this week according to TMDB">
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="mt-6">
                <TabsList className="mb-3 max-sm:flex max-sm:justify-around">
                    <TabsTrigger value="overview" className="px-6 md:px-8">
                        <MediaAndUserIcon type="overview"/> All
                    </TabsTrigger>
                    <TabsTrigger value={MediaType.MOVIES} className="px-4 md:px-6">
                        <MediaAndUserIcon type={MediaType.MOVIES}/> Movies
                    </TabsTrigger>
                    <TabsTrigger value={MediaType.SERIES} className="px-4 md:px-6">
                        <MediaAndUserIcon type={MediaType.SERIES}/> TV Shows
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={selectedTab}>
                    <TrendHero trend={heroMedia}/>
                    <TrendGrid data={filteredTrends}/>
                </TabsContent>
            </Tabs>
        </PageTitle>
    );
}
