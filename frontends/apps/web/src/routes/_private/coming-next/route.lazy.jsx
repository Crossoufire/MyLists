import {useHashTab} from "@/hooks/useHashTab";
import {upcomingOptions} from "@mylists/api/src/queryOptions";
import {MediaCard} from "@/components/app/MediaCard";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MutedText} from "@/components/app/MutedText";
import {PageTitle} from "@/components/app/PageTitle";
import {createLazyFileRoute} from "@tanstack/react-router";
import {capitalize, formatDateTime, zeroPad} from "@/utils/functions";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {MediaIcon} from "@/components/app/MediaIcon";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/coming-next")({
    component: ComingNextPage,
});


function ComingNextPage() {
    const apiData = useSuspenseQuery(upcomingOptions()).data;
    const [selectedTab, handleTabChange] = useHashTab("series");

    return (
        <PageTitle title="Coming Next" subtitle="Discover your upcoming media. Explore your planned watchlist/playlist">
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="mt-2">
                <TabsList className="my-4 max-sm:flex max-sm:gap-x-2 max-sm:justify-start max-sm:flex-wrap max-sm:h-auto max-sm:space-y-1">
                    {apiData.map(next =>
                        <TabsTrigger key={next.media_type} value={next.media_type} className="max-sm:px-2 px-4 flex items-center gap-2">
                            <MediaIcon mediaType={next.media_type}/> {capitalize(next.media_type)}
                        </TabsTrigger>
                    )}
                </TabsList>
                {apiData.map(next =>
                    <TabsContent key={next.media_type} value={next.media_type}>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-6 sm:gap-5">
                            {next.items.length === 0 ?
                                <MutedText className="px-2 col-span-12">No upcoming {next.media_type} found</MutedText>
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
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-1 bg-gray-900 w-full rounded-b-sm text-center">
                {(mediaType === "anime" || mediaType === "series") &&
                    <div>S{zeroPad(media.season_to_air)}&nbsp;-&nbsp;E{zeroPad(media.episode_to_air)}</div>
                }
                <div>{formatDateTime(media.date)}</div>
            </div>
        </MediaCard>
    );
};
