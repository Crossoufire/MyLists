import {useHashTab} from "@/lib/hooks/use-hash-tab";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {DangerForm} from "@/lib/components/user-settings/DangerForm";
import {Sidebar, SideBarItem} from "@/lib/components/general/Sidebar";
import {GeneralForm} from "@/lib/components/user-settings/GeneralForm";
import {PasswordForm} from "@/lib/components/user-settings/PasswordForm";
import {MediaListForm} from "@/lib/components/user-settings/MediaListForm";


export const Route = createFileRoute("/_main/_private/settings")({
    component: SettingsPage,
});


const tabConfig = [
    { sidebarTitle: "General", component: <GeneralForm/> },
    { sidebarTitle: "MediaList", component: <MediaListForm/> },
    { sidebarTitle: "Password", component: <PasswordForm/> },
    { sidebarTitle: "Advanced", component: <DangerForm/> },
] as const;
type TabConfigTypes = typeof tabConfig[number]["sidebarTitle"];


function SettingsPage() {
    const [selectedTabTitle, handleTabChange] = useHashTab<TabConfigTypes>("General");
    const selectedItem = tabConfig.find((tab) => tab.sidebarTitle === selectedTabTitle);

    const sidebarItems: SideBarItem<typeof tabConfig[number]>[] = tabConfig.map(
        (tab) => ({ is: "tab", data: tab })
    );

    const handleSidebarChange = (tab: typeof tabConfig[number]) => {
        handleTabChange(tab.sidebarTitle);
    };

    return (
        <PageTitle title="Settings" subtitle="Customize Your Profile: Manage Your Preferences and Account Settings">
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr] gap-10 mt-6">
                <Sidebar
                    items={sidebarItems}
                    selectedItem={selectedItem}
                    onTabChange={handleSidebarChange}
                />
                {selectedItem?.component}
            </div>
        </PageTitle>
    );
}
