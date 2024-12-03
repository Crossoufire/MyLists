import {PageTitle} from "@/components/app/PageTitle";
import {MediaIcon} from "@/components/app/MediaIcon";
import {achievementOptions} from "@mylists/api/queryOptions";
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

    const mediaTypes = [
        { value: "all", label: "All", icon: null },
        { value: "series", label: "Series", icon: <MediaIcon mediaType="series"/> },
        { value: "anime", label: "Anime", icon: <MediaIcon mediaType="anime"/> },
        { value: "movies", label: "Movies", icon: <MediaIcon mediaType="movies"/> },
        { value: "games", label: "Games", icon: <MediaIcon mediaType="games"/> },
        { value: "books", label: "Books", icon: <MediaIcon mediaType="books"/> },
    ];

    return (
        <PageTitle title={`${username} Achievements`} subtitle="View all the achievements the user gained.">
            <Tabs defaultValue="all">
                <TabsList className="my-4 max-sm:flex max-sm:gap-x-2 max-sm:justify-start max-sm:flex-wrap max-sm:h-auto max-sm:space-y-1">
                    {mediaTypes.map(mt =>
                        <TabsTrigger key={mt.value} value={mt.value} className="max-sm:px-2 px-4 flex items-center gap-2">
                            {mt.icon} {mt.label}
                        </TabsTrigger>
                    )}
                </TabsList>
                {mediaTypes.map(mt =>
                    <TabsContent key={mt.value} value={mt.value}>
                        <AchievementSummary
                            mediaType={mt.value}
                            summary={apiData.summary[mt.value]}
                        />
                        <div className="grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-6">
                            {apiData.result.filter(achievement => mt.value === "all" || mt.value === achievement.media_type)
                                .map(achievement =>
                                    <AchievementCard
                                        key={achievement.id}
                                        achievement={achievement}
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
