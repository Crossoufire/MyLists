import {useState} from "react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {PageTitle} from "@/components/app/PageTitle";
import {createFileRoute} from "@tanstack/react-router";
import {DangerForm} from "@/components/settings/DangerForm";
import {GeneralForm} from "@/components/settings/GeneralForm";
import {PasswordForm} from "@/components/settings/PasswordForm";
import {MediaListForm} from "@/components/settings/MediaListForm";


// noinspection JSUnusedGlobalSymbols,JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/settings")({
    component: SettingsPage,
});


const tabConfig = [
    {label: "General", form: <GeneralForm/>},
    {label: "MediaList", form: <MediaListForm/>},
    {label: "Password", form: <PasswordForm/>},
    {label: "Advanced", form: <DangerForm/>},
];


function SettingsPage() {
    const [selectedTab, setSelectedTab] = useState("General");

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };

    return (
        <PageTitle title="Settings" subtitle="Customize Your Profile: Manage Your Preferences and Account Settings">
            <div className="grid w-full items-start gap-10 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr] mt-6 max-w-[900px]">
                <nav className="flex flex-wrap text-muted-foreground justify-center md:flex-col md:gap-3 md:justify-start">
                    {tabConfig.map(tab =>
                        <Button
                            key={tab.label}
                            variant={selectedTab === tab.label ? "secondary" : "ghost"}
                            className={cn("justify-start", tab.label === "Advanced" && "text-destructive")}
                            onClick={() => handleTabChange(tab.label)}
                        >
                            {tab.label}
                        </Button>
                    )}
                </nav>
                {tabConfig.find(tab => tab.label === selectedTab).form}
            </div>
        </PageTitle>
    );
}