import {useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MediaLevels} from "@/lib/client/components/user-profile/MediaLevels";
import {OverviewTab} from "@/lib/client/components/user-profile/OverviewTab";
import {TabHeader, TabItem} from "@/lib/client/components/general/TabHeader";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {MediaStatsTab} from "@/lib/client/components/user-profile/MediaStatsTab";
import {ProfileFollows} from "@/lib/client/components/user-profile/ProfileFollows";
import {profileOptions} from "@/lib/client/react-query/query-options/query-options";
import {AchievementsCard} from "@/lib/client/components/user-profile/AchievementCard";
import {FollowsUpdates, UserUpdates} from "@/lib/client/components/user-profile/UserUpdates";


export const Route = createFileRoute("/_main/_private/profile/$username/_header/")({
    component: ProfileMain,
});


function ProfileMain() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(profileOptions(username)).data;
    const [activeTab, setActiveTab] = useState<MediaType | "overview">("overview");
    const activeMediaTypes = apiData.userData.userMediaSettings.filter((s) => s.active).map((s) => s.mediaType);

    const mediaTabs: TabItem<MediaType | "overview">[] = [
        {
            id: "overview",
            isAccent: true,
            label: "Overview",
            icon: <MainThemeIcon size={15} type="overview"/>,
        },
        ...activeMediaTypes.map((mediaType) => ({
            id: mediaType,
            label: mediaType,
            icon: <MainThemeIcon size={15} type={mediaType}/>,
        })),
    ];

    return (
        <div className="grid grid-cols-[0.26fr_0.74fr] gap-6 pt-2 max-lg:grid-cols-5 max-sm:grid-cols-1">
            <div className="space-y-4 max-lg:col-span-2 max-sm:space-y-6">
                <MediaLevels
                    username={username}
                    settings={apiData.userData.userMediaSettings}
                />
                <UserUpdates
                    updates={apiData.userUpdates}
                />
                <ProfileFollows
                    username={username}
                    follows={apiData.userFollows}
                    followsCount={apiData.followsCount}
                />
            </div>

            <div className="space-y-6 max-lg:col-span-3 max-sm:col-span-2 max-sm:space-y-4 max-sm:mt-4">
                <TabHeader
                    tabs={mediaTabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
                <div className="min-h-113 animate-in fade-in duration-300">
                    {activeTab === "overview" ?
                        <OverviewTab
                            username={username}
                            perMedia={apiData.perMediaSummary}
                            globalStats={apiData.mediaGlobalSummary}
                        />
                        :
                        <MediaStatsTab
                            username={username}
                            mediaSummary={apiData.perMediaSummary.find((p) => p.mediaType === activeTab)!}
                        />
                    }
                </div>

                <div className="grid grid-cols-[0.42fr_0.58fr] gap-6 pt-6 border-t-2 max-lg:grid-cols-1 max-sm:grid-cols-1">
                    <div className="max-lg:order-2">
                        <AchievementsCard
                            username={username}
                            achievements={apiData.achievements}
                        />
                    </div>
                    <FollowsUpdates
                        updates={apiData.followsUpdates}
                    />
                </div>
            </div>
        </div>
    );
}
