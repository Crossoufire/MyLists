import {capitalize} from "@/lib/utils";
import {ErrorPage} from "@/pages/ErrorPage";
import {useFetchData} from "@/hooks/FetchDataHook";
import {PageTitle} from "@/components/app/PageTitle";
import {Loading} from "@/components/primitives/Loading";
import {NextMedia} from "@/components/comingNext/nextMedia";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


export const ComingNextPage = () => {
    const { apiData, loading, error } = useFetchData("/coming_next");

    if (error) return <ErrorPage error={error}/>;
    if (loading) return <Loading/>;

    return (
        <PageTitle title="Coming Next" subtitle="Discover your upcoming media. Explore your planned watchlist and playlist.">
            <Tabs defaultValue="series" className="mt-5">
                <TabsList className="mb-6">
                    {apiData.map(next =>
                        <TabsTrigger value={next.media_type} className="px-6">
                            {capitalize(next.media_type)}
                        </TabsTrigger>
                    )}
                </TabsList>
                {apiData.map(next =>
                    <TabsContent value={next.media_type}>
                        <div className="grid grid-cols-12 lg:gap-4">
                            {next.items.length === 0 ?
                                <div className="px-2 text-muted-foreground italic col-span-12">
                                    No new coming next for {next.media_type} found
                                </div>
                                :
                                next.items.map(media =>
                                    <div key={media.id} className="col-span-4 md:col-span-3 lg:col-span-2">
                                        <NextMedia
                                            mediaType={next.media_type}
                                            media={media}
                                        />
                                    </div>
                                )
                            }
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </PageTitle>
    );
};
