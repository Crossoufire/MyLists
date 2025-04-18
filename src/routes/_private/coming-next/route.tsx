import {MediaType} from "@/lib/server/utils/enums";
import {useHashTab} from "@/lib/hooks/use-hash-tab";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MediaCard} from "@/lib/components/app/MediaCard";
import {MutedText} from "@/lib/components/app/MutedText";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {MediaIcon} from "@/lib/components/app/MediaIcon";
import {upcomingOptions} from "@/lib/react-query/query-options";
import {capitalize, formatDateTime, zeroPad} from "@/lib/utils/functions";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";


export const Route = createFileRoute("/_private/coming-next")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(upcomingOptions()),
    component: ComingNextPage,
});


function ComingNextPage() {
    const apiData = useSuspenseQuery(upcomingOptions()).data;
    const [selectedTab, handleTabChange] = useHashTab<MediaType>(MediaType.SERIES);

    return (
        <PageTitle title="Coming Next" subtitle="Discover your upcoming media. Explore your planned watchlist/playlist">
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="mt-2">
                <TabsList className="my-4 max-sm:flex max-sm:gap-x-2 max-sm:justify-start max-sm:flex-wrap max-sm:h-auto max-sm:space-y-1">
                    {apiData.map((next) => (
                        <TabsTrigger key={next.mediaType} value={next.mediaType} className="max-sm:px-2 px-4 flex items-center gap-2">
                            <MediaIcon mediaType={next.mediaType} size={18}/>{" "}
                            {capitalize(next.mediaType)}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {apiData.map((next) => (
                    <TabsContent key={next.mediaType} value={next.mediaType}>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-6 sm:gap-5">
                            {next.items.length === 0 ?
                                <MutedText className="px-2 col-span-12">
                                    No upcoming {next.mediaType} found
                                </MutedText>
                                :
                                next.items.map((media) => (
                                    <div key={media.mediaId}>
                                        <NextMedia
                                            media={media}
                                            mediaType={next.mediaType}
                                        />
                                    </div>
                                ))
                            }
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </PageTitle>
    );
}


interface NextMediaProps {
    mediaType: MediaType;
    media: Record<string, any>;
}


const NextMedia = ({ media, mediaType }: NextMediaProps) => {
    return (
        <MediaCard item={media} mediaType={mediaType}>
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-1 bg-gray-900 w-full rounded-b-sm text-center">
                {(mediaType === MediaType.ANIME || mediaType === MediaType.SERIES) && (
                    <div>S{zeroPad(media.seasonToAir)}&nbsp;-&nbsp;E{zeroPad(media.episodeToAir)}</div>
                )}
                <div>{formatDateTime(media.date)}</div>
            </div>
        </MediaCard>
    );
};
