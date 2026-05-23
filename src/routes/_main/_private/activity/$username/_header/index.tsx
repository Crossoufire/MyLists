import {MediaType} from "@/lib/utils/enums";
import React, {useState} from "react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {formatMinutes} from "@/lib/utils/formating";
import {Badge} from "@/lib/client/components/ui/badge";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Switch} from "@/lib/client/components/ui/switch";
import {Button} from "@/lib/client/components/ui/button";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {Pagination} from "@/lib/client/components/general/Pagination";
import {MediaCard} from "@/lib/client/components/media/base/MediaCard";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {SearchInput} from "@/lib/client/components/general/SearchInput";
import {CalendarNav} from "@/lib/client/components/activity/CalendarNav";
import {useSearchNavigate} from "@/lib/client/hooks/use-search-navigate";
import {ActivityAddDialog} from "@/lib/client/components/activity/ActivityAddDialog";
import {ActivityEditDialog} from "@/lib/client/components/activity/ActivityEditDialog";
import {MediaCornerCommon} from "@/lib/client/components/media/base/MediaCornerCommon";
import {ActivityEditor, ActivityKind, ActivitySearch} from "@/lib/types/activity.types";
import {getActivityUnitLabel, toActivityDisplayValue} from "@/lib/utils/activity-utils";
import {CheckCircle, Clock, Hourglass, LayoutGrid, Plus, RotateCw, Settings2} from "lucide-react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";
import {monthlyActivityOptions, monthlyActivityStatsOptions} from "@/lib/client/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_private/activity/$username/_header/")({
    validateSearch: (search) => search as ActivitySearch,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { username }, deps: { search } }) => {
        await Promise.all([
            queryClient.ensureQueryData(monthlyActivityOptions(username, search)),
            queryClient.ensureQueryData(monthlyActivityStatsOptions(username, { year: search.year, month: search.month })),
        ]);
    },
    component: MonthlyActivityPage,
});


const activityKindFilters: { label: string, value: ActivityKind }[] = [
    { label: "All Activities", value: "all" },
    { label: "Completed", value: "completed" },
    { label: "In progress", value: "progressed" },
    { label: "Re-experience", value: "redo" },
];


function MonthlyActivityPage() {
    const { currentUser } = useAuth();
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { username } = Route.useParams();
    const canEdit = currentUser?.name === username;
    const [addActivity, setAddActivity] = useState(false);
    const apiData = useSuspenseQuery(monthlyActivityOptions(username, filters)).data;
    const [editActivity, setEditActivity] = useState<ActivityEditor | null>(null);
    const activeMediaTypes = currentUser?.settings.filter(s => s.active).map(s => s.mediaType) ?? apiData.mediaTypes;
    const { activeTab = "all", activityKind = "all", hiddenOnly = false, search = "", page = 1, ...dateFilters } = filters;
    const { localSearch, handleInputChange, updateFilters } = useSearchNavigate<ActivitySearch>({
        search: filters.search ?? "",
        options: { resetScroll: false },
    });

    const handleFilterChange = (next: Partial<ActivitySearch>) => {
        void navigate({ search: { ...filters, page: 1, ...next } });
    };

    return (
        <div className="space-y-4">
            <CalendarNav
                activeYear={Number(dateFilters.year)}
                activeMonth={Number(dateFilters.month)}
                onDateChange={(year, month) => handleFilterChange({ year, month, activeTab: "all" })}
            />

            <MonthlyActivityStats
                username={username}
                year={dateFilters.year}
                month={dateFilters.month}
            />

            <div className="flex flex-wrap items-center gap-3">
                <Select value={activityKind} onValueChange={(v) => handleFilterChange({ activityKind: v as ActivityKind })}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="Activity Kind"/>
                    </SelectTrigger>
                    <SelectContent>
                        {activityKindFilters.map((filter) =>
                            <SelectItem key={filter.value} value={filter.value}>
                                {filter.label}
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>

                <div className="grow">
                    <SearchInput
                        className="w-full"
                        value={localSearch}
                        onChange={handleInputChange}
                        placeholder="Search activity by title..."
                    />
                </div>

                <Select value={activeTab} onValueChange={(v) => handleFilterChange({ activeTab: v as MediaType | "all" })}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="Media type"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            <div className="flex items-center gap-2">
                                <MainThemeIcon type="all"/>
                                <span>All Types</span>
                            </div>
                        </SelectItem>
                        {apiData.mediaTypes.map((mediaType) =>
                            <SelectItem key={mediaType} value={mediaType}>
                                <div className="flex items-center gap-2 capitalize">
                                    <MainThemeIcon type={mediaType}/>
                                    <span>{mediaType}</span>
                                </div>
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
                {canEdit &&
                    <>
                        <Button variant="outline" onClick={() => setAddActivity(true)}>
                            <Plus className="size-4"/>
                            Add activity
                        </Button>
                        <Button variant="outline" asChild>
                            <label className=" flex items-center gap-2 text-sm text-muted-foreground max-sm:ml-0">
                                <Switch
                                    checked={hiddenOnly}
                                    onCheckedChange={(checked) => handleFilterChange({ hiddenOnly: checked })}
                                />
                                Only hidden
                            </label>
                        </Button>
                    </>
                }
            </div>

            {apiData.items.length === 0 &&
                <EmptyState
                    iconSize={50}
                    className="py-20"
                    icon={LayoutGrid}
                    message={hiddenOnly ? "No hidden activity." : "No activity recorded."}
                />
            }

            {apiData.items.length > 0 &&
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {apiData.items.map((row) =>
                        <MediaCard key={row.id} item={{ ...row, mediaCover: row.mediaCover }} mediaType={row.mediaType}>
                            <div className="absolute left-1.5 top-1.5 z-10 flex flex-col items-start gap-1">
                                {row.hidden &&
                                    <Badge variant="destructive">Hidden</Badge>
                                }
                            </div>
                            {canEdit &&
                                <>
                                    <MediaCornerCommon/>
                                    <div className="absolute right-2 top-2 z-10 flex gap-1">
                                        <div role="button" onClick={() => setEditActivity(row)}>
                                            <Settings2 className="size-4 opacity-70 hover:opacity-90 transition-opacity"/>
                                        </div>
                                    </div>
                                </>
                            }
                            <div className="absolute bottom-0 w-full space-y-2 rounded-b-sm p-3">
                                <div className="flex w-full items-center justify-between space-x-2 max-sm:text-sm">
                                    <h3 className="grow truncate font-semibold" title={row.mediaName}>
                                        {row.mediaName}
                                    </h3>
                                </div>
                                <div className="flex w-full flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <MainThemeIcon type={row.mediaType} size={14}/>
                                    <span>-</span>
                                    <span>{formatMinutes(row.timeGained)}</span>
                                    <ActivityStatusIcon row={row}/>
                                </div>
                            </div>
                        </MediaCard>
                    )}
                </div>
            }

            <div className="text-muted-foreground text-sm flex justify-end -mt-2">
                {apiData.total} items
            </div>

            <Pagination
                currentPage={page}
                totalPages={apiData.pages}
                onChangePage={(nextPage) => updateFilters({ page: nextPage })}
            />

            {editActivity &&
                <ActivityEditDialog
                    activity={editActivity}
                    open={Boolean(editActivity)}
                    onOpenChange={() => setEditActivity(null)}
                />
            }

            <ActivityAddDialog
                open={addActivity}
                onOpenChange={setAddActivity}
                mediaTypes={activeMediaTypes}
                year={Number(dateFilters.year)}
                month={Number(dateFilters.month)}
            />
        </div>
    );
}


function MonthlyActivityStats({ username, year, month }: { username: string, year: string, month: string }) {
    const stats = useSuspenseQuery(monthlyActivityStatsOptions(username, { year, month })).data;

    return (
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="flex min-h-20 min-w-0 max-w-45 flex-col justify-between rounded-md border bg-background px-3 py-2">
                <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <Clock className="text-app-accent" size={15}/>
                        <span className="truncate text-sm font-medium capitalize">
                        Monthly Time
                    </span>
                    </div>
                </div>
                <div className="text-lg font-semibold">
                    {formatMinutes(stats.totalTime)}
                </div>
            </div>
            {stats.mediaStats.map((stat) => {
                const unitLabel = getActivityUnitLabel(stat.mediaType, "short");

                return (
                    <div className="flex min-h-20 min-w-0 max-w-45 flex-col justify-between rounded-md border bg-background px-3 py-2">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                                <MainThemeIcon type={stat.mediaType} size={15}/>
                                <span className="truncate text-sm font-medium capitalize">
                                    {stat.mediaType}
                                </span>
                            </div>
                            {unitLabel && stat.specificTotal > 0 &&
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {toActivityDisplayValue(stat.mediaType, stat.specificTotal)} {unitLabel}
                                </span>
                            }
                        </div>
                        <div className="text-lg font-semibold">
                            {formatMinutes(stat.timeGained)}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}


function ActivityStatusIcon({ row }: { row: ActivityEditor }) {
    const { label, icon: Icon } = (() => {
        if (row.isRedo) return { label: "Re-experience", icon: RotateCw };
        if (row.isCompleted) return { label: "Completed", icon: CheckCircle };
        return { label: "In progress", icon: Hourglass };
    })();

    return (
        <span className="ml-auto" title={label}>
            <Icon className="text-neutral-300" size={12}/>
        </span>
    );
}
