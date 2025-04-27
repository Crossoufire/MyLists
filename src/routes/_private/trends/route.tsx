import {useHashTab} from "@/lib/hooks/use-hash-tab";
import {formatDateTime} from "@/lib/utils/functions";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Separator} from "@/lib/components/ui/separator";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {createFileRoute, Link} from "@tanstack/react-router";
import {trendsOptions} from "@/lib/react-query/query-options";
import {Card, CardContent, CardTitle} from "@/lib/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";


export const Route = createFileRoute("/_private/trends")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(trendsOptions()),
    component: TrendsPage,
});


function TrendsPage() {
    const apiData = useSuspenseQuery(trendsOptions()).data;
    const [selectedTab, handleTabChange] = useHashTab<"series" | "movies">("movies");

    return (
        <PageTitle title="Week Trends" subtitle="The Series and Movies trending this week according to TMDB">
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="mt-4">
                <TabsList className="mb-3 max-sm:flex max-sm:justify-around">
                    {/*<TabsTrigger value="series" className="px-6 md:px-8">*/}
                    {/*    Trending TV*/}
                    {/*</TabsTrigger>*/}
                    <TabsTrigger value="movies" className="px-6 md:px-8">
                        Trending Movies
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="series">
                    {/*<div className="grid grid-cols-12 gap-6">*/}
                    {/*    {apiData.tv_trends.map((media) => (*/}
                    {/*        <div key={media.api_id} className="col-span-12 md:col-span-6 lg:col-span-4">*/}
                    {/*            <TrendItem media={media}/>*/}
                    {/*        </div>*/}
                    {/*    ))}*/}
                    {/*</div>*/}
                </TabsContent>
                <TabsContent value="movies">
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


const TrendItem = ({ media }: { media: any }) => {
    return (
        <Card className="h-full">
            <div className="grid grid-cols-12">
                <div className="col-span-5">
                    <Link
                        to="/details/$mediaType/$mediaId"
                        params={{ mediaType: media.mediaType, mediaId: media.apiId }}
                        search={{ external: true }}
                    >
                        <img
                            className="rounded-md"
                            src={media.posterPath}
                            alt={media.displayName}
                        />
                    </Link>
                </div>
                <div className="col-span-7">
                    <CardContent className="pt-3">
                        <Link
                            to="/details/$mediaType/$mediaId"
                            params={{ mediaType: media.mediaType, mediaId: media.apiId }}
                            search={{ external: true }}
                        >
                            <CardTitle className="flex flex-col items-start">
                                <div className="text-lg line-clamp-2">{media.displayName}</div>
                                <div className="text-muted-foreground text-sm text-grey italic">
                                    {formatDateTime(media.releaseDate)}
                                </div>
                            </CardTitle>
                        </Link>
                        <Separator/>
                        <CardContent className="line-clamp-5 p-0">
                            {media.overview}
                        </CardContent>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
};
