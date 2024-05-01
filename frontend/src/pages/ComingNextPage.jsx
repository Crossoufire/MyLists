import {ErrorPage} from "@/pages/ErrorPage";
import {useFetchData} from "@/hooks/FetchDataHook";
import {capitalize, cn, zeroPad} from "@/lib/utils";
import {PageTitle} from "@/components/app/PageTitle";
import {MediaCard} from "@/components/app/MediaCard.jsx";
import {Loading} from "@/components/app/base/Loading";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


export const ComingNextPage = () => {
    const { apiData, loading, error } = useFetchData("/coming_next");

    if (error) return <ErrorPage {...error}/>;

    return (
        <PageTitle title="Coming Next" subtitle="Discover your upcoming media. Explore your planned watchlist and playlist">
            {loading ?
                <Loading/>
                :
                <Tabs defaultValue="series" className="mt-5">
                    <TabsList className="mb-5 max-sm:flex max-sm:justify-around">
                        {apiData.map(next =>
                            <TabsTrigger key={next.media_type} value={next.media_type} className="md:px-8">
                                {capitalize(next.media_type)}
                            </TabsTrigger>
                        )}
                    </TabsList>
                    {apiData.map(next =>
                        <TabsContent key={next.media_type} value={next.media_type}>
                            <div className="grid grid-cols-12 lg:gap-4">
                                {next.items.length === 0 ?
                                    <div className="px-2 text-muted-foreground italic col-span-12">
                                        No new coming next for {next.media_type} found
                                    </div>
                                    :
                                    next.items.map(media =>
                                        <div key={media.media_id} className="col-span-4 md:col-span-3 lg:col-span-2">
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
            }
        </PageTitle>
    );
};


const NextMedia = ({ mediaType, media }) => {
    let datePosition = "bottom-[-32px]";
    if (mediaType === "movies" || mediaType === "games") {
        datePosition = "bottom-0";
    }

    return (
        <MediaCard media={media} mediaType={mediaType}>
            {(mediaType === "anime" || mediaType === "series") &&
                <div className="absolute bottom-0 flex justify-center items-center h-[32px] w-full opacity-95 border
                bg-neutral-900 border-black border-solid">
                    S{zeroPad(media.season_to_air)}&nbsp;-&nbsp;E{zeroPad(media.episode_to_air)}
                </div>
            }
            <div className={cn("absolute bottom-0 h-[32px] w-full flex justify-center items-center opacity-90 " +
                "bg-gray-900 border border-x-black border-b-black border-t-transparent", datePosition)}>
                {media.formatted_date}
            </div>
        </MediaCard>
    )
};
