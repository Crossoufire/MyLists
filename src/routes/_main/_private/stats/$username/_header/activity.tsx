import {useMemo} from "react";
import {MediaType} from "@/lib/utils/enums";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {GridItem} from "@/lib/types/activity.types";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {CheckCircle2, LayoutGrid, RotateCcw, TrendingUp} from "lucide-react";
import {monthlyActivityOptions} from "@/lib/client/react-query/query-options/query-options";
import {ActivityHeader, ActivitySectionGrid} from "@/lib/client/components/activity/ActivityShared";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


export const Route = createFileRoute("/_main/_private/stats/$username/_header/activity")({
    validateSearch: (search) => search as { year: string, month: string, activeTab?: MediaType | "all" },
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { username }, deps: { search } }) => {
        return queryClient.ensureQueryData(monthlyActivityOptions(username, search));
    },
    component: MonthlyActivityPage,
});


function MonthlyActivityPage() {
    const { currentUser } = useAuth();
    const navigate = Route.useNavigate();
    const { username } = Route.useParams();
    const { activeTab = "all", ...filters } = Route.useSearch();
    const apiData = useSuspenseQuery(monthlyActivityOptions(username, filters)).data;

    const canEdit = currentUser?.name === username;
    const mediaTypes = (Object.keys(apiData) as MediaType[]).filter((key) => apiData[key].count > 0);

    const handleTabChange = (tab: string) => {
        void navigate({ search: { ...filters, activeTab: tab as (MediaType | "all") } });
    }

    const viewData = useMemo(() => {
        const mediaTypesToProcess = activeTab === "all" ? mediaTypes : [activeTab];

        let totalTime = 0;
        let redoCount = 0;
        let totalCount = 0;
        let totalSpecific = 0;
        let completedCount = 0;
        let progressedCount = 0;

        const redo: GridItem[] = [];
        const completed: GridItem[] = [];
        const progressed: GridItem[] = [];

        mediaTypesToProcess.forEach((mediaType) => {
            const entry = apiData[mediaType];
            if (!entry) return;

            totalCount += entry.count;
            totalTime += entry.timeGained;

            redoCount += entry.redoCount;
            completedCount += entry.completedCount;
            progressedCount += entry.progressedCount;

            if (activeTab !== "all") {
                totalSpecific += entry.specificTotal;
            }

            entry.redo.forEach((item) => redo.push({ data: item, mediaType }));
            entry.completed.forEach((item) => completed.push({ data: item, mediaType }));
            entry.progressed.forEach((item) => progressed.push({ data: item, mediaType }));
        });

        const sorter = (a: GridItem, b: GridItem) => b.data.timeGained - a.data.timeGained;

        return {
            totalTime,
            totalCount,
            totalSpecific,
            redoCount,
            completedCount,
            progressedCount,
            redo: redo.sort(sorter),
            completed: completed.sort(sorter),
            progressed: progressed.sort(sorter),
        };
    }, [apiData, activeTab, mediaTypes]);

    const hasData = viewData.completed.length > 0 || viewData.progressed.length > 0 || viewData.redo.length > 0;

    return (
        <div className="space-y-6">
            <ActivityHeader
                mediaType={activeTab}
                count={viewData.totalCount}
                timeGained={viewData.totalTime}
                specificTotal={viewData.totalSpecific}
                dates={{ year: Number(filters.year), month: Number(filters.month) }}
                onDateChange={(y, m) => navigate({ search: { year: String(y), month: String(m) } })}
            />
            <div className="ml-auto w-50 max-sm:w-full">
                <Select value={activeTab} onValueChange={handleTabChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by Type"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            <div className="flex items-center gap-2">
                                <MainThemeIcon type="all"/>
                                <span>All Types</span>
                            </div>
                        </SelectItem>
                        {mediaTypes.map((type) =>
                            <SelectItem key={type} value={type}>
                                <div className="flex items-center gap-2 capitalize">
                                    <MainThemeIcon type={type}/>
                                    <span>{type}</span>
                                </div>
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
            {hasData ?
                <div key={activeTab}>
                    <ActivitySectionGrid
                        title="Completed"
                        canEdit={canEdit}
                        username={username}
                        section="completed"
                        icon={CheckCircle2}
                        year={filters.year}
                        month={filters.month}
                        mediaType={activeTab}
                        initialItems={viewData.completed}
                        totalCount={viewData.completedCount}
                    />
                    <ActivitySectionGrid
                        icon={TrendingUp}
                        canEdit={canEdit}
                        username={username}
                        title="In Progress"
                        section="progressed"
                        year={filters.year}
                        month={filters.month}
                        mediaType={activeTab}
                        initialItems={viewData.progressed}
                        totalCount={viewData.progressedCount}
                    />
                    <ActivitySectionGrid
                        section="redo"
                        icon={RotateCcw}
                        canEdit={canEdit}
                        username={username}
                        year={filters.year}
                        month={filters.month}
                        mediaType={activeTab}
                        title="Re-experienced"
                        initialItems={viewData.redo}
                        totalCount={viewData.redoCount}
                    />
                </div>
                :
                <EmptyState
                    iconSize={50}
                    className="py-20"
                    icon={LayoutGrid}
                    message="No activity recorded."
                />
            }
        </div>
    );
}
