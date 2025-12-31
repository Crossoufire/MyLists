import React from "react";
import {cn} from "@/lib/utils/helpers";


export interface TabItem<T> {
    id: T;
    label: string;
    isAccent?: boolean;
    icon?: React.ReactNode;
}


interface TabHeaderProps<T extends string> {
    activeTab: T;
    tabs: TabItem<T>[];
    setActiveTab: (value: T) => void;
}


export const TabHeader = <T extends string>({ tabs, activeTab, setActiveTab }: TabHeaderProps<T>) => {
    return (
        <div className="scrollbar-thin flex items-center gap-1 overflow-x-auto border-b">
            {tabs.map((tab) => {
                const isActive = (activeTab === tab.id);

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "relative flex items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-medium transition-all",
                            isActive ? tab.isAccent ? "text-app-accent" : "text-primary" : "text-muted-foreground hover:text-primary",
                        )}
                    >
                        {tab.icon &&
                            <span className="shrink-0">
                                {tab.icon}
                            </span>
                        }
                        <span className="capitalize">
                            {tab.label}
                        </span>
                        {isActive &&
                            <div className="bg-app-accent absolute bottom-0 left-0 right-0 h-0.5"/>
                        }
                    </button>
                );
            })}
        </div>
    );
};