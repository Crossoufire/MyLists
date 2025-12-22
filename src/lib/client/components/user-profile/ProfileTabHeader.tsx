import {cn} from "@/lib/utils/helpers";
import {BarChart3} from "lucide-react";
import {MediaType} from "@/lib/utils/enums";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";


interface ProfileTabHeaderProps {
    mediaTypes: MediaType[];
    activeTab: MediaType | "overview";
    setActiveTab: (value: MediaType | "overview") => void;
}


export const ProfileTabHeader = ({ activeTab, setActiveTab, mediaTypes }: ProfileTabHeaderProps) => {
    const tabs: { label: MediaType | "overview", icon: React.ReactNode }[] = [{
        label: "overview",
        icon: <BarChart3 className="size-4"/>,
    }, ...mediaTypes.map((mediaType) => ({
        label: mediaType,
        icon: <MediaAndUserIcon size={16} type={mediaType}/>
    }))];

    return (
        <div className="flex items-center gap-1 overflow-x-auto border-b scrollbar-thin">
            {tabs.map((tab) =>
                <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    className={cn(
                        "relative flex items-center gap-2 px-5 py-3 text-sm rounded-t-lg font-bold transition-all",
                        activeTab === tab.label ? activeTab === "overview" ? "text-app-accent bg-accent/20" :
                            "text-primary bg-accent/20" : "text-muted-foreground hover:text-muted-foreground/110"
                    )}
                >
                    <MediaAndUserIcon
                        size={16}
                        type={tab.label}
                    />
                    <span className="capitalize">
                        {tab.label}
                    </span>
                    {activeTab === tab.label &&
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-app-accent"/>
                    }
                </button>
            )}
        </div>
    );
};
