import {capitalize} from "@/lib/utils/functions";
import {MediaType} from "@/lib/utils/enums";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";
import {AchievementCard} from "@/lib/client/components/achievements/AchievementCard";
import {achievementOptions} from "@/lib/client/react-query/query-options/query-options";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs";
import {AchievementSummary} from "@/lib/client/components/achievements/AchievementSummary";


export const Route = createFileRoute("/_main/_private/achievements/$username")({
    loader: async ({ context: { queryClient }, params: { username } }) => {
        return queryClient.ensureQueryData(achievementOptions(username));
    },
    component: AchievementPage,
});


function AchievementPage() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(achievementOptions(username)).data;

    return (
        <PageTitle title={`${username} Achievements`} subtitle="View all the achievements the user gained.">
            <Tabs defaultValue="all">
                <TabsList className="my-3 max-sm:flex max-sm:flex-wrap max-sm:h-auto">
                    {Object.entries(apiData.summary).map(([mt]) =>
                        <TabsTrigger key={mt} value={mt}>
                            <div className="flex items-center gap-2">
                                <MediaAndUserIcon type={mt as MediaType}/> {capitalize(mt)}
                            </div>
                        </TabsTrigger>
                    )}
                </TabsList>
                {Object.entries(apiData.summary).map(([mt, summary]) =>
                    <TabsContent key={mt} value={mt} className="space-y-5">
                        <AchievementSummary summary={summary}/>
                        <div className="grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-6">
                            {apiData.result.filter((r) => mt === "all" || mt === r.mediaType).map((achievement) =>
                                <AchievementCard
                                    key={achievement.id}
                                    achievement={achievement}
                                />
                            )}
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </PageTitle>
    );
}
