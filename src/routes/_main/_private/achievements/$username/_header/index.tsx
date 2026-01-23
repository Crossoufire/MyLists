import {useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {TabHeader, TabItem} from "@/lib/client/components/general/TabHeader";
import {AchievementCard} from "@/lib/client/components/achievements/AchievementCard";
import {achievementOptions} from "@/lib/client/react-query/query-options/query-options";
import {AchievementSummary} from "@/lib/client/components/achievements/AchievementSummary";


export const Route = createFileRoute("/_main/_private/achievements/$username/_header/")({
    loader: async ({ context: { queryClient }, params: { username } }) => {
        return queryClient.ensureQueryData(achievementOptions(username));
    },
    component: AchievementPage,
});


function AchievementPage() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(achievementOptions(username)).data;
    const [activeTab, setActiveTab] = useState<MediaType | "all">("all");
    const mediaAchievements = apiData.result.filter((r) => activeTab === "all" || r.mediaType === activeTab);

    const mediaTypes = Object.values(MediaType);
    const mediaTabs: TabItem<"all" | MediaType>[] = [
        {
            id: "all",
            label: "All",
            isAccent: true,
            icon: <MainThemeIcon size={15} type="all"/>,
        },
        ...mediaTypes.map((mediaType) => ({
            id: mediaType,
            label: mediaType,
            icon: <MainThemeIcon size={15} type={mediaType}/>,
        })),
    ];

    return (
        <>
            <div className="space-y-6">
                <TabHeader
                    tabs={mediaTabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />

                <AchievementSummary
                    summary={apiData.summary[activeTab]}
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
        </>
    );
}
