import {Fragment} from "react";
import {fetcher} from "@/lib/fetcherLoader";
import {capitalize, formatDateTime, zeroPad} from "@/lib/utils";
import {MediaCard} from "@/components/app/MediaCard";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/components/app/base/PageTitle";
import {MutedText} from "@/components/app/base/MutedText";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/coming-next")({
    component: ComingNextPage,
    loader: async () => fetcher("/list/upcoming"),
});


function ComingNextPage() {
    const apiData = Route.useLoaderData();

    return (
        <PageTitle title="Coming Next" subtitle="Discover your upcoming media. Explore your planned watchlist/playlist">
            <Tabs defaultValue="series" className="mt-5">
                <TabsList className="mb-5 max-sm:flex max-sm:justify-around">
                    {apiData.map(next =>
                        <TabsTrigger key={next.media_type} value={next.media_type} className="md:px-8">
                            {capitalize(next.media_type)} ({next.items.length})
                        </TabsTrigger>
                    )}
                </TabsList>
                {apiData.map(next =>
                    <TabsContent key={next.media_type} value={next.media_type}>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-6 sm:gap-5">
                            {next.items.length === 0 ?
                                <MutedText
                                    className="col-span-12 px-2"
                                    text={`No upcoming ${next.media_type} found`}
                                />
                                :
                                next.items.map(media =>
                                    <NextMedia
                                        media={media}
                                        key={media.media_id}
                                        mediaType={next.media_type}
                                    />
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
    console.log(media);
    return (
        <MediaCard media={media} mediaType={mediaType}>
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-1 bg-gray-950 w-full rounded-b-sm text-center">
                {(mediaType === "anime" || mediaType === "series") &&
                    <div>S{zeroPad(media.season_to_air)}&nbsp;-&nbsp;E{zeroPad(media.episode_to_air)}</div>
                }
                <div>{formatDateTime(media.release_date)}</div>
            </div>
        </MediaCard>
    );
};
