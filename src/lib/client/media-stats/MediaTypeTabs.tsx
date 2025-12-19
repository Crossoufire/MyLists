import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/functions";
import {TabValue} from "@/lib/types/stats.types";
import {Tabs, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";


interface MediaTypeTabsProps {
    selectedTab: TabValue;
    activatedMediaTypes: MediaType[];
    onTabChange: (value: string) => void;
}


export const MediaTypeTabs = ({ selectedTab, onTabChange, activatedMediaTypes }: MediaTypeTabsProps) => {
    const allTabs: TabValue[] = ["overview", ...Object.values(MediaType)];

    return (
        <Tabs value={selectedTab} onValueChange={onTabChange}>
            <TabsList className="flex h-auto flex-wrap gap-4 max-sm:gap-2">
                {allTabs.map((tab) => {
                    const isDisabled = !(tab === "overview") && !activatedMediaTypes.includes(tab as MediaType);

                    return (
                        <TabsTrigger key={tab} value={tab} disabled={isDisabled}>
                            <div className="flex items-center justify-center gap-2">
                                <MediaAndUserIcon type={tab}/>
                                <span>{capitalize(tab)}</span>
                            </div>
                        </TabsTrigger>
                    );
                })}
            </TabsList>
        </Tabs>
    );
};
