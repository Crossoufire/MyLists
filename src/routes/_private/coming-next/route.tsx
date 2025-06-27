import {MediaType} from "@/lib/server/utils/enums";
import {useHashTab} from "@/lib/hooks/use-hash-tab";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MediaCard} from "@/lib/components/app/MediaCard";
import {MutedText} from "@/lib/components/app/MutedText";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {MediaIcon} from "@/lib/components/app/MediaIcon";
import {ComingNext} from "@/lib/server/types/base.types";
import {capitalize, formatDateTime, zeroPad} from "@/lib/utils/functions";
import {upcomingOptions} from "@/lib/react-query/query-options/query-options";
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
                        <TabsTrigger key={next?.mediaType} value={next?.mediaType ?? MediaType.SERIES} className="max-sm:px-2 px-4 flex items-center gap-2">
                            <MediaIcon mediaType={next?.mediaType ?? MediaType.SERIES} size={18}/>{" "}
                            {capitalize(next?.mediaType)}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {apiData.map((next) => (
                    <TabsContent key={next?.mediaType} value={next?.mediaType ?? MediaType.SERIES}>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-6 sm:gap-5">
                            {next?.items.length === 0 ?
                                <MutedText className="px-2 col-span-12">
                                    No upcoming {next?.mediaType} found
                                </MutedText>
                                :
                                next?.items.map((item) => (
                                    <div key={item.mediaId}>
                                        <NextMedia
                                            item={item}
                                            mediaType={next?.mediaType}
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
    item: ComingNext;
    mediaType: MediaType;
}


const NextMedia = ({ item, mediaType }: NextMediaProps) => {
    return (
        <MediaCard item={item} mediaType={mediaType}>
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-1 bg-gray-900 w-full rounded-b-sm text-center">
                {(mediaType === MediaType.ANIME || mediaType === MediaType.SERIES) &&
                    <div>S{zeroPad(item.seasonToAir!)}&nbsp;-&nbsp;E{zeroPad(item.episodeToAir!)}</div>
                }
                <div>{formatDateTime(item.date)}</div>
            </div>
        </MediaCard>
    );
};
