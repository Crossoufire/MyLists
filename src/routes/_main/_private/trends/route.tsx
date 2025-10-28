import {MediaType} from "@/lib/utils/enums";
import {useHashTab} from "@/lib/client/hooks/use-hash-tab";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {TrendItem} from "@/lib/client/components/trends/TrendItem";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {trendsOptions} from "@/lib/client/react-query/query-options/query-options";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs";


export const Route = createFileRoute("/_main/_private/trends")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(trendsOptions()),
    component: TrendsPage,
});


function TrendsPage() {
    const apiData = useSuspenseQuery(trendsOptions()).data;
    const [selectedTab, handleTabChange] = useHashTab<typeof MediaType.SERIES | typeof MediaType.MOVIES>(MediaType.SERIES);

    return (
        <PageTitle title="Week Trends" subtitle="The Series and Movies trending this week according to TMDB">
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="mt-4">
                <TabsList className="mb-3 max-sm:flex max-sm:justify-around">
                    <TabsTrigger value={MediaType.SERIES} className="px-6 md:px-8">
                        Trending TV
                    </TabsTrigger>
                    <TabsTrigger value={MediaType.MOVIES} className="px-6 md:px-8">
                        Trending Movies
                    </TabsTrigger>
                </TabsList>
                <TabsContent value={MediaType.SERIES}>
                    <div className="grid grid-cols-12 gap-6 max-sm:gap-3">
                        {apiData.seriesTrends.map((media) =>
                            <div key={media.apiId} className="col-span-12 md:col-span-6 lg:col-span-4">
                                <TrendItem item={media}/>
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value={MediaType.MOVIES}>
                    <div className="grid grid-cols-12 gap-6 max-sm:gap-3">
                        {apiData.moviesTrends.map((media) =>
                            <div key={media.apiId} className="col-span-12 md:col-span-6 lg:col-span-4">
                                <TrendItem item={media}/>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </PageTitle>
    );
}
