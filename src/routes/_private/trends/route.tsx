import {MediaType} from "@/lib/server/utils/enums";
import {useHashTab} from "@/lib/hooks/use-hash-tab";
import {formatDateTime} from "@/lib/utils/functions";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Separator} from "@/lib/components/ui/separator";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {createFileRoute, Link} from "@tanstack/react-router";
import {TrendsMedia} from "@/lib/server/types/provider.types";
import {Card, CardContent, CardTitle} from "@/lib/components/ui/card";
import {trendsOptions} from "@/lib/react-query/query-options/query-options";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";


export const Route = createFileRoute("/_private/trends")({
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
                    <div className="grid grid-cols-12 gap-6">
                        {apiData.seriesTrends.map((media) => (
                            <div key={media.apiId} className="col-span-12 md:col-span-6 lg:col-span-4">
                                <TrendItem media={media}/>
                            </div>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value={MediaType.MOVIES}>
                    <div className="grid grid-cols-12 gap-6">
                        {apiData.moviesTrends.map((media) => (
                            <div key={media.apiId} className="col-span-12 md:col-span-6 lg:col-span-4">
                                <TrendItem media={media}/>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </PageTitle>
    );
}


const TrendItem = ({ media }: { media: TrendsMedia }) => {
    const { apiId, posterPath, displayName, mediaType, releaseDate, overview } = media;
    
    return (
        <Card className="h-full">
            <div className="grid grid-cols-12">
                <div className="col-span-5">
                    <Link
                        to="/details/$mediaType/$mediaId"
                        params={{ mediaType, mediaId: apiId }}
                        search={{ external: true }}
                    >
                        <img
                            className="rounded-md"
                            src={posterPath}
                            alt={displayName}
                        />
                    </Link>
                </div>
                <div className="col-span-7">
                    <CardContent className="pt-3">
                        <Link
                            to="/details/$mediaType/$mediaId"
                            params={{ mediaType: mediaType, mediaId: apiId }}
                            search={{ external: true }}
                        >
                            <CardTitle className="flex flex-col items-start">
                                <div className="text-lg line-clamp-2">{displayName}</div>
                                <div className="text-muted-foreground text-sm text-grey italic">
                                    {formatDateTime(releaseDate)}
                                </div>
                            </CardTitle>
                        </Link>
                        <Separator/>
                        <CardContent className="line-clamp-5 p-0">
                            {overview}
                        </CardContent>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
};
