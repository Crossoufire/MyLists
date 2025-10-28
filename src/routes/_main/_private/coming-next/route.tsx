import {capitalize} from "@/lib/utils/functions";
import {MediaType} from "@/lib/utils/enums";
import {useHashTab} from "@/lib/client/hooks/use-hash-tab";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {ComingNextMedia} from "@/lib/client/components/coming-next/ComingNextMedia";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";
import {upcomingOptions} from "@/lib/client/react-query/query-options/query-options";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs";


export const Route = createFileRoute("/_main/_private/coming-next")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(upcomingOptions()),
    component: ComingNextPage,
});


function ComingNextPage() {
    const apiData = useSuspenseQuery(upcomingOptions()).data;
    const [selectedTab, handleTabChange] = useHashTab<MediaType>(MediaType.SERIES);

    return (
        <PageTitle title="Coming Next" subtitle="Discover your upcoming media. Explore your planned watchlist/playlist">
            <Tabs value={selectedTab} onValueChange={handleTabChange}>
                <TabsList className="my-4 max-sm:w-full max-sm:flex max-sm:justify-start max-sm:flex-wrap max-sm:h-auto">
                    {apiData.map((next) =>
                        <TabsTrigger key={next.mediaType} value={next.mediaType} className="max-sm:px-2 px-4 flex items-center gap-2">
                            <MediaAndUserIcon type={next.mediaType}/>{" "}
                            {capitalize(next.mediaType)}
                        </TabsTrigger>
                    )}
                </TabsList>
                {apiData.map((next) =>
                    <TabsContent key={next.mediaType} value={next.mediaType}>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-6 sm:gap-5">
                            {next.items.length === 0 ?
                                <MutedText className="px-2 col-span-12">
                                    No upcoming {next.mediaType} found
                                </MutedText>
                                :
                                next.items.map((item) =>
                                    <div key={item.mediaId}>
                                        <ComingNextMedia
                                            item={item}
                                            mediaType={next.mediaType}
                                        />
                                    </div>
                                )}
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </PageTitle>
    );
}


