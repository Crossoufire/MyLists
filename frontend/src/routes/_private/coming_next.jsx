import {fetcher} from "@/lib/fetcherLoader";
import {capitalize, zeroPad} from "@/lib/utils";
import {PageTitle} from "@/components/app/PageTitle";
import {MediaCard} from "@/components/app/MediaCard";
import {createFileRoute} from "@tanstack/react-router";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/coming_next")({
    component: ComingNextPage,
    loader: async () => fetcher("/coming_next"),
});


function ComingNextPage() {
    const apiData = Route.useLoaderData();

    return (
        <PageTitle title="Coming Next" subtitle="Discover your upcoming media. Explore your planned watchlist/playlist">
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
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-6 sm:gap-5">
                            {next.items.length === 0 ?
                                <div className="px-2 text-muted-foreground italic col-span-12">
                                    No new coming next for {next.media_type} found
                                </div>
                                :
                                next.items.map(media =>
                                    <div key={media.media_id}>
                                        <NextMedia
                                            media={media}
                                            mediaType={next.media_type}
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
}


const NextMedia = ({ media, mediaType }) => {
    return (
        <MediaCard media={media} mediaType={mediaType}>
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-1 bg-gray-950 w-full rounded-b-sm text-center">
                {(mediaType === "anime" || mediaType === "series") &&
                    <div>S{zeroPad(media.season_to_air)}&nbsp;-&nbsp;E{zeroPad(media.episode_to_air)}</div>
                }
                <div>{media.formatted_date}</div>
            </div>
        </MediaCard>
    );
};
