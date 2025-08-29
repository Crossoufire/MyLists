import {capitalize} from "@/lib/utils/functions";
import {MediaType} from "@/lib/server/utils/enums";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {MediaAndUserIcon} from "@/lib/components/media/base/MediaAndUserIcon";
import {AchievementCard} from "@/lib/components/achievements/AchievementCard";
import {achievementOptions} from "@/lib/react-query/query-options/query-options";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";
import {AchievementSummary} from "@/lib/components/achievements/AchievementSummary";


export const Route = createFileRoute("/_private/achievements/$username")({
    loader: async ({ context: { queryClient }, params: { username } }) => queryClient.ensureQueryData(achievementOptions(username)),
    component: AchievementPage,
});


function AchievementPage() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(achievementOptions(username)).data;

    return (
        <PageTitle title={`${username} Achievements`} subtitle="View all the achievements the user gained.">
            <Tabs defaultValue="all">
                <TabsList className="my-4 max-sm:flex max-sm:gap-x-2 max-sm:justify-start max-sm:flex-wrap max-sm:h-auto max-sm:space-y-1">
                    {Object.entries(apiData.summary).map(([mt, _]) =>
                        <TabsTrigger key={mt} value={mt} className="max-sm:px-2 px-4 flex items-center gap-2">
                            <MediaAndUserIcon type={mt as MediaType}/> {capitalize(mt)}
                        </TabsTrigger>
                    )}
                </TabsList>
                {Object.entries(apiData.summary).map(([mt, summary]) =>
                    <TabsContent key={mt} value={mt}>
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
