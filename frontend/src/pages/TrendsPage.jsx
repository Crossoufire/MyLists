import {ErrorPage} from "@/pages/ErrorPage";
import {useFetchData} from "@/hooks/FetchDataHook";
import {PageTitle} from "@/components/app/PageTitle";
import {Loading} from "@/components/primitives/Loading";
import {TrendItem} from "@/components/trends/TrendItem";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


export const TrendsPage = () => {
    const { apiData, loading, error } = useFetchData("/current_trends");

    if (error) return <ErrorPage {...error}/>;
    if (loading) return <Loading/>;

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
    )
};
