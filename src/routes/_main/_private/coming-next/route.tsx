import {useMemo, useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {LayoutGrid, List} from "lucide-react";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {ComingNextItem} from "@/lib/types/query.options.types";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {TabHeader, TabItem} from "@/lib/client/components/general/TabHeader";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {upcomingOptions} from "@/lib/client/react-query/query-options/query-options";
import {ComingNextSection} from "@/lib/client/components/coming-next/ComingNextSection";
import {getDaysRemaining} from "@/lib/utils/formating";


export const Route = createFileRoute("/_main/_private/coming-next")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(upcomingOptions),
    component: ComingNextPage,
});


function ComingNextPage() {
    const apiData = useSuspenseQuery(upcomingOptions).data;
    const mediaTypes = apiData.map((next) => next.mediaType);
    const [activeTab, setActiveTab] = useState<MediaType | "all">("all");

    const allItems = useMemo(() => {
        return apiData.flatMap((group) =>
            group.items.map(item => ({ ...item, mediaType: group.mediaType }))
        );
    }, []);

    const processedData = useMemo(() => {
        let filtered = activeTab === "all" ? allItems : allItems.filter((item) => item.mediaType === activeTab);

        filtered = filtered.filter((item) => {
            if (!item.date) return true;
            const days = getDaysRemaining(item.date);
            return days === null || days >= -7;
        });

        return filtered.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }, [allItems, activeTab]);

    const sections = useMemo(() => {
        const groups: Record<string, (ComingNextItem & { mediaType: MediaType })[]> = {
            today: [], thisWeek: [], next30Days: [], later: [], tba: [],
        };

        processedData.forEach((item) => {
            const days = getDaysRemaining(item.date);

            if (item.date === null || days === null) groups.tba.push(item);
            else if (days <= 0) groups.today.push(item);
            else if (days <= 7) groups.thisWeek.push(item);
            else if (days <= 30) groups.next30Days.push(item);
            else groups.later.push(item);
        });

        return groups;
    }, [processedData]);

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
        <PageTitle title="Coming Next" subtitle="Your personalized schedule for upcoming episodes, premieres, and releases.">
            <TabHeader
                tabs={mediaTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <div className="space-y-10 mt-7 mb-12">
                <ComingNextSection
                    title="Releasing Now"
                    items={sections.today}
                />
                <ComingNextSection
                    title="This Week"
                    items={sections.thisWeek}
                />
                <ComingNextSection
                    title="Coming this Month"
                    items={sections.next30Days}
                />
                <ComingNextSection
                    items={sections.later}
                    title="Later this Year"
                />
                <ComingNextSection
                    items={sections.tba}
                    title="To Be Announced"
                />

                {processedData.length === 0 &&
                    <EmptyState
                        icon={List}
                        iconSize={35}
                        className="py-20"
                        message={`No upcoming ${activeTab === "all" ? "media" : activeTab} found`}
                    />
                }
            </div>
        </PageTitle>
    );
}
