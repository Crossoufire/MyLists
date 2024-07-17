import {fetcher} from "@/lib/fetcherLoader.jsx";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/base/PageTitle.jsx";
import {createFileRoute, Link} from "@tanstack/react-router";
import {Card, CardContent, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/trends")({
    component: TrendsPage,
    loader: async () => fetcher("/current_trends"),
});


function TrendsPage() {
    const apiData = Route.useLoaderData();

    return (
        <PageTitle title="Week Trends" subtitle="The Series and Movies trending this week according to TMDB">
            <Tabs defaultValue="series" className="mt-4">
                <TabsList className="mb-3 max-sm:flex max-sm:justify-around">
                    <TabsTrigger value="series" className="px-6 md:px-8">Trending TV</TabsTrigger>
                    <TabsTrigger value="movies" className="px-6 md:px-8">Trending Movies</TabsTrigger>
                </TabsList>
                <TabsContent value="series">
                    <div className="grid grid-cols-12 gap-6">
                        {apiData.tv_trends.map((media, idx) =>
                            <div key={media.api_id} className="col-span-12 md:col-span-6 lg:col-span-4">
                                <TrendItem
                                    media={media}
                                    idx={idx}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="movies">
                    <div className="grid grid-cols-12 gap-6">
                        {apiData.movies_trends.map((media, idx) =>
                            <div key={media.api_id} className="col-span-12 md:col-span-6 lg:col-span-4">
                                <TrendItem
                                    media={media}
                                    idx={idx}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </PageTitle>
    );
}


const TrendItem = ({ media }) => {
    return (
        <Card className="h-full">
            <div className="grid grid-cols-12">
                <div className="col-span-5">
                    <Link to={`/details/${media.media_type}/${media.api_id}?external=True`}>
                        <img src={media.poster_path} className="rounded-md" alt={media.display_name}/>
                    </Link>
                </div>
                <div className="col-span-7">
                    <CardContent className="pt-3">
                        <Link to={`/details/${media.media_type}/${media.api_id}?external=True`}>
                            <CardTitle className="flex flex-col items-start">
                                <div className="text-lg line-clamp-2">{media.display_name}</div>
                                <div className="text-muted-foreground text-sm text-grey mt-1 italic">{media.release_date}</div>
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
    )
};
