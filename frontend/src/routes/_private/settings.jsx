import {useHashTab} from "@/hooks/HashTabHook";
import {Sidebar} from "@/components/app/Sidebar";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/components/app/base/PageTitle";
import {DangerForm} from "@/components/settings/DangerForm";
import {GeneralForm} from "@/components/settings/GeneralForm";
import {PasswordForm} from "@/components/settings/PasswordForm";
import {MediaListForm} from "@/components/settings/MediaListForm";


// noinspection JSUnusedGlobalSymbols,JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/settings")({
    component: SettingsPage,
});


const tabConfig = [
    {sidebarTitle: "General", form: <GeneralForm/>},
    {sidebarTitle: "MediaList", form: <MediaListForm/>},
    {sidebarTitle: "Password", form: <PasswordForm/>},
    {sidebarTitle: "Advanced", form: <DangerForm/>},
];


function SettingsPage() {
    const [selectedTab, handleTabChange] = useHashTab("General");

    return (
        <PageTitle title="Settings" subtitle="Customize Your Profile: Manage Your Preferences and Account Settings">
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr] gap-10 mt-6">
                <Sidebar
                    items={tabConfig}
                    selectedTab={selectedTab}
                    onTabChange={handleTabChange}
                />
                {tabConfig.find(tab => tab.sidebarTitle === selectedTab).form}
            </div>
        </PageTitle>
    );
}