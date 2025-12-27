import {useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {AchievementCard} from "@/lib/client/components/achievements/AchievementCard";
import {ProfileTabHeader} from "@/lib/client/components/user-profile/ProfileTabHeader";
import {achievementOptions} from "@/lib/client/react-query/query-options/query-options";
import {AchievementSummary} from "@/lib/client/components/achievements/AchievementSummary";


export const Route = createFileRoute("/_main/_private/achievements/$username")({
    loader: async ({ context: { queryClient }, params: { username } }) => {
        return queryClient.ensureQueryData(achievementOptions(username));
    },
    component: AchievementPage,
});


function AchievementPage() {
    const { username } = Route.useParams();
    const mediaTypes = Object.values(MediaType);
    const apiData = useSuspenseQuery(achievementOptions(username)).data;
    const [activeTab, setActiveTab] = useState<MediaType | "overview">("overview");

    const activeSummary = apiData.summary[activeTab];
    const mediaAchievements = apiData.result.filter((r) => activeTab === "overview" || r.mediaType === activeTab);
    
    return (
        <PageTitle title={`${username} Achievements`} subtitle="View all the achievements the user gained.">
            <div className="space-y-6 mt-6">
                <ProfileTabHeader
                    activeTab={activeTab}
                    mediaTypes={mediaTypes}
                    setActiveTab={setActiveTab}
                />

                <AchievementSummary
                    summary={activeSummary}
                />

                <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
                    {mediaAchievements.map((achievement) =>
                        <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                        />
                    )}
                </div>
            </div>
        </PageTitle>
    );
}
