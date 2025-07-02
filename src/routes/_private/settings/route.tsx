import {useHashTab} from "@/lib/hooks/use-hash-tab";
import {Sidebar} from "@/lib/components/general/Sidebar";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {DangerForm} from "@/lib/components/user-settings/DangerForm";
import {GeneralForm} from "@/lib/components/user-settings/GeneralForm";
import {PasswordForm} from "@/lib/components/user-settings/PasswordForm";
import {MediaListForm} from "@/lib/components/user-settings/MediaListForm";


export const Route = createFileRoute("/_private/settings")({
    component: SettingsPage,
});


type TabConfigTypes = typeof tabConfig[number]["sidebarTitle"];
const tabConfig = [
    { sidebarTitle: "General", component: <GeneralForm/> },
    { sidebarTitle: "MediaList", component: <MediaListForm/> },
    { sidebarTitle: "Password", component: <PasswordForm/> },
    { sidebarTitle: "Advanced", component: <DangerForm/> },
] as const;


function SettingsPage() {
    const [selectedTab, handleTabChange] = useHashTab<TabConfigTypes>("General");

    return (
        <PageTitle title="Settings" subtitle="Customize Your Profile: Manage Your Preferences and Account Settings">
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr] gap-10 mt-6">
                <Sidebar
                    items={tabConfig}
                    selectedTab={selectedTab}
                    onTabChange={handleTabChange}
                />
                {tabConfig.find((tab) => tab.sidebarTitle === selectedTab)?.component}
            </div>
        </PageTitle>
    );
}
