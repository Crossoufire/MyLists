import {achievementOptions} from "@/api";
import {capitalize} from "@/utils/functions";
import {PageTitle} from "@/components/app/PageTitle";
import {MediaIcon} from "@/components/app/MediaIcon";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createLazyFileRoute} from "@tanstack/react-router";
import {AchievementCard} from "@/components/achievements/AchievementCard";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {AchievementSummary} from "@/components/achievements/AchievementSummary";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/achievements/$username")({
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
                            <MediaIcon mediaType={mt}/> {capitalize(mt)}
                        </TabsTrigger>
                    )}
                </TabsList>
                {Object.entries(apiData.summary).map(([mt, summary]) =>
                    <TabsContent key={mt} value={mt}>
                        <AchievementSummary
                            mediaType={mt}
                            summary={summary}
                        />
                        <div className="grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-6">
                            {apiData.result.filter(a => mt === "all" || mt === a.media_type).map(ach =>
                                <AchievementCard
                                    key={ach.id}
                                    achievement={ach}
                                />
                            )}
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </PageTitle>
    );
}
