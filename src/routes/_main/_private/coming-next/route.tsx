import React, {useMemo} from "react";
import {MediaType} from "@/lib/utils/enums";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {getDaysRemaining} from "@/lib/utils/functions";
import {Hourglass, List, PlayCircle} from "lucide-react";
import {useHashTab} from "@/lib/client/hooks/use-hash-tab";
import {ComingNextItem} from "@/lib/types/query.options.types";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {EmptyState} from "@/lib/client/components/user-profile/EmptyState";
import {ComingNextCard} from "@/lib/client/components/coming-next/ComingNextCard";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";
import {upcomingOptions} from "@/lib/client/react-query/query-options/query-options";
import {ProfileTabHeader} from "@/lib/client/components/user-profile/ProfileTabHeader";


export const Route = createFileRoute("/_main/_private/coming-next")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(upcomingOptions),
    component: ComingNextPage,
});


function ComingNextPage() {
    const apiData = useSuspenseQuery(upcomingOptions).data;
    const mediaTypes = apiData.map((next) => next.mediaType);
    const [activeTab, setActiveTab] = useHashTab<MediaType | "overview">("overview");

    const allItems = useMemo(() => {
        return apiData.flatMap((group) =>
            group.items.map(item => ({ ...item, mediaType: group.mediaType }))
        );
    }, []);

    const processedData = useMemo(() => {
        let filtered = activeTab === "overview" ? allItems : allItems.filter((item) => item.mediaType === activeTab);

        filtered = filtered.filter((item) => {
            if (!item.date) return true;
            const days = getDaysRemaining(item.date);
            if (!days) return true;
            return days >= -7;
        });

        return filtered.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }, [allItems, activeTab]);

    const groupedSections = useMemo(() => {
        const sections: {
            today: (ComingNextItem & { mediaType: MediaType })[],
            thisWeek: (ComingNextItem & { mediaType: MediaType })[],
            next30Days: (ComingNextItem & { mediaType: MediaType })[],
            later: (ComingNextItem & { mediaType: MediaType })[],
            tba: (ComingNextItem & { mediaType: MediaType })[],
        } = { today: [], thisWeek: [], next30Days: [], later: [], tba: [] };

        processedData.forEach((item) => {
            const days = getDaysRemaining(item.date);

            if (item.date === null || days === null) {
                sections.tba.push(item);
            }
            else if (days <= 0) {
                sections.today.push(item);
            }
            else if (days === 0) {
                sections.today.push(item);
            }
            else if (days <= 7) {
                sections.thisWeek.push(item);
            }
            else if (days <= 30) {
                sections.next30Days.push(item);
            }
            else {
                sections.later.push(item);
            }
        });

        return sections;
    }, [processedData]);

    return (
        <PageTitle title="Coming Next" subtitle="Your personalized schedule for upcoming episodes, premieres, and releases.">
            <div className="mt-6">
                <ProfileTabHeader
                    activeTab={activeTab}
                    mediaTypes={mediaTypes}
                    setActiveTab={setActiveTab}
                />
            </div>

            <div className="space-y-10 mt-7 mb-12">
                {groupedSections.today.length > 0 &&
                    <section>
                        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                            <PlayCircle className="text-red-500 size-5"/>
                            Releasing Now
                        </h2>
                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                            {groupedSections.today.map((item, idx) =>
                                <ComingNextCard
                                    item={item}
                                    mediaType={item.mediaType}
                                    key={`${item.mediaId}-${idx}`}
                                />
                            )}
                        </div>
                    </section>
                }

                {groupedSections.thisWeek.length > 0 &&
                    <section>
                        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                            <span className="w-2 h-8 rounded bg-app-accent block mr-1"/>
                            This Week
                        </h2>
                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                            {groupedSections.thisWeek.map((item, idx) =>
                                <ComingNextCard
                                    item={item}
                                    mediaType={item.mediaType}
                                    key={`${item.mediaId}-${idx}`}
                                />
                            )}
                        </div>
                    </section>
                }

                {groupedSections.next30Days.length > 0 &&
                    <section>
                        <h2 className="text-lg font-bold text-primary mb-4 pl-1">
                            Coming this Month
                        </h2>
                        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                            {groupedSections.next30Days.map((item, idx) =>
                                <ComingNextCard
                                    item={item}
                                    mediaType={item.mediaType}
                                    key={`${item.mediaId}-${idx}`}
                                />
                            )}
                        </div>
                    </section>
                }

                {groupedSections.later.length > 0 &&
                    <section>
                        <h2 className="text-lg font-bold text-primary mb-4 pl-1">
                            Later this Year
                        </h2>
                        <div className="grid grid-cols-2 gap-3 opacity-90 max-sm:grid-cols-1">
                            {groupedSections.later.map((item, idx) =>
                                <ComingNextCard
                                    item={item}
                                    mediaType={item.mediaType}
                                    key={`${item.mediaId}-${idx}`}
                                />
                            )}
                        </div>
                    </section>
                }

                {groupedSections.tba.length > 0 &&
                    <section className="pt-8 border-t border-slate-800/50">
                        <h2 className="text-lg font-bold text-slate-500 mb-4 pl-1 flex items-center gap-2">
                            <Hourglass className="size-5"/>
                            To Be Announced
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {groupedSections.tba.map((item, idx) =>
                                <div key={`${item.mediaId}-${idx}`} className="flex items-center gap-3 p-3 rounded-lg
                                bg-slate-900/50 border border-slate-800 border-dashed">
                                    <img
                                        src={item.imageCover}
                                        alt={item.mediaName}
                                        className="w-12 h-16 object-cover rounded shadow-sm opacity-70"
                                    />
                                    <div>
                                        <div className="text-sm font-bold text-slate-300 line-clamp-1">
                                            {item.mediaName}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <MediaAndUserIcon type={item.mediaType}/>
                                            <span className="capitalize">
                                                {item.mediaType}
                                            </span>
                                            <span>•</span>
                                            <span>{item.status}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                }

                {processedData.length === 0 &&
                    <EmptyState
                        icon={List}
                        className="py-20"
                        message={`No upcoming ${activeTab === "overview" ? "media" : activeTab} found`}
                    />
                }
            </div>
        </PageTitle>
    );
}
