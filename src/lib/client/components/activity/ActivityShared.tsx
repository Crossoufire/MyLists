import {MediaType} from "@/lib/utils/enums";
import {GridItem} from "@/lib/types/activity.types";
import {getMediaUnitLabel} from "@/lib/utils/mapping";
import {Badge} from "@/lib/client/components/ui/badge";
import {useInfiniteQuery} from "@tanstack/react-query";
import {StatCard} from "@/lib/client/media-stats/StatCard";
import {capitalize, formatMinutes} from "@/lib/utils/formating";
import {MediaCard} from "@/lib/client/components/media/base/MediaCard";
import {Clock, LayoutGrid, LucideIcon, TrendingUp} from "lucide-react";
import {CalendarNav} from "@/lib/client/components/activity/CalendarNav";
import {sectionActivityQueryOptions} from "@/lib/client/react-query/query-options/query-options";


interface ActivityHeaderProps {
    count: number;
    timeGained: number;
    specificTotal: number;
    mediaType: MediaType | "all";
    dates: { year: number, month: number };
    onDateChange: (year: number, month: number) => void;
}


export const ActivityHeader = ({ onDateChange, timeGained, count, specificTotal, mediaType, dates }: ActivityHeaderProps) => {
    return (
        <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between">
            <CalendarNav
                dates={dates}
                onChange={onDateChange}
            />
            <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 sm:flex sm:justify-end">
                <StatCard
                    title="Total Time"
                    value={formatMinutes(timeGained)}
                    icon={<Clock className="size-4"/>}
                    className="w-full max-w-50 max-sm:w-auto"
                />
                <StatCard
                    value={count}
                    icon={<LayoutGrid className="size-4"/>}
                    className="w-full max-w-50 max-sm:w-auto"
                    title={`${mediaType === "all" ? "Media" : capitalize(mediaType)} Touched`}
                />
                {mediaType !== "all" && mediaType !== MediaType.GAMES && mediaType !== MediaType.MOVIES &&
                    <StatCard
                        value={specificTotal}
                        icon={<TrendingUp className="size-4"/>}
                        className="w-full max-w-50 max-sm:w-auto"
                        title={`Total ${getMediaUnitLabel(mediaType)}`}
                    />
                }
            </div>
        </div>
    );
}


interface ActivitySectionGridProps {
    year: string;
    month: string;
    title: string;
    username: string;
    icon: LucideIcon;
    totalCount: number;
    showBadge?: boolean;
    initialItems: GridItem[];
    mediaType: MediaType | "all";
    section: "completed" | "progressed" | "redo";
}


export const ActivitySectionGrid = (props: ActivitySectionGridProps) => {
    const { title, username, initialItems, totalCount, section, mediaType, year, month, icon: Icon, showBadge = false } = props;

    const limitedInitialItems = initialItems.slice(0, 24);
    const hasMoreThanInitial = totalCount > limitedInitialItems.length;

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        ...sectionActivityQueryOptions(username, { year, month, mediaType, section }),
        initialData: {
            pageParams: [0],
            pages: [{ total: totalCount, items: limitedInitialItems, hasMore: hasMoreThanInitial }],
        },
    });

    const items = data.pages.flatMap((page) => page.items);
    const remaining = totalCount - items.length;

    if (!totalCount) return null;

    return (
        <div className="mb-8 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
                <Icon size={18} className="text-app-accent"/>
                <h3 className="text-lg font-semibold tracking-tight">
                    {title}
                </h3>
                <span className="ml-auto rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {items.length}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {items.map((wrapper) =>
                    <MediaCard key={`${wrapper.mediaType}-${wrapper.data.mediaId}`} item={wrapper.data} mediaType={wrapper.mediaType}>
                        {showBadge &&
                            <div className="absolute right-2 top-2 z-10">
                                <Badge variant="outline" className="bg-popover capitalize">
                                    {wrapper.mediaType}
                                </Badge>
                            </div>
                        }
                        <div className="absolute bottom-0 w-full space-y-2 rounded-b-sm p-3">
                            <h3 className="grow truncate font-semibold text-sm sm:text-base" title={wrapper.data.mediaName}>
                                {wrapper.data.mediaName}
                            </h3>
                            <div className="flex w-full flex-wrap items-center justify-between text-xs font-medium text-muted-foreground">
                                <span>
                                    {formatMinutes(wrapper.data.timeGained)}
                                </span>
                                {wrapper.mediaType !== MediaType.GAMES &&
                                    <span>
                                        +{wrapper.data.specificGained}{" "}
                                        {getMediaUnitLabel(wrapper.mediaType, "short")}
                                    </span>
                                }
                            </div>
                        </div>
                    </MediaCard>
                )}
            </div>
            {hasNextPage && remaining > 0 &&
                <button
                    disabled={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                    className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground
                    hover:bg-secondary/50 disabled:opacity-50"
                >
                    {isFetchingNextPage ? "Loading..." : `Load more (${remaining} remaining)`}
                </button>
            }
        </div>
    );
};
