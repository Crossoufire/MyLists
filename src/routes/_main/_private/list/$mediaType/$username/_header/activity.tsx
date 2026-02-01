import {MediaData} from "@/lib/types/activity.types";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {CheckCircle2, LayoutGrid, RotateCcw, TrendingUp} from "lucide-react";
import {activityQueryOptions} from "@/lib/client/react-query/query-options/query-options";
import {ActivityHeader, ActivitySectionGrid} from "@/lib/client/components/activity/ActivityShared";


export const Route = createFileRoute("/_main/_private/list/$mediaType/$username/_header/activity")({
    validateSearch: (search) => search as { year: string, month: string },
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { username }, deps: { search } }) => {
        return queryClient.ensureQueryData(activityQueryOptions(username, search));
    },
    component: ActivityPage,
});


function ActivityPage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { mediaType, username } = Route.useParams();
    const data = useSuspenseQuery(activityQueryOptions(username, filters)).data[mediaType];
    const hasData = data.completed.length > 0 || data.progressed.length > 0 || data.redo.length > 0;

    const wrap = (items: MediaData[]) => {
        return items.map(data => ({ data, mediaType }));
    };

    return (
        <div className="space-y-8">
            <ActivityHeader
                count={data.count}
                mediaType={mediaType}
                timeGained={data.timeGained}
                specificTotal={data.specificTotal}
                onDateChange={(y, m) => navigate({ search: { year: String(y), month: String(m) } })}
            />
            {hasData ?
                <>
                    <ActivitySectionGrid
                        title="Completed"
                        username={username}
                        icon={CheckCircle2}
                        section="completed"
                        year={filters.year}
                        month={filters.month}
                        mediaType={mediaType}
                        totalCount={data.completedCount}
                        initialItems={wrap(data.completed)}
                    />
                    <ActivitySectionGrid
                        icon={TrendingUp}
                        username={username}
                        title="In Progress"
                        section="progressed"
                        year={filters.year}
                        mediaType={mediaType}
                        month={filters.month}
                        totalCount={data.progressedCount}
                        initialItems={wrap(data.progressed)}
                    />
                    <ActivitySectionGrid
                        section="redo"
                        icon={RotateCcw}
                        username={username}
                        year={filters.year}
                        month={filters.month}
                        mediaType={mediaType}
                        title="Re-experienced"
                        totalCount={data.redoCount}
                        initialItems={wrap(data.redo)}
                    />
                </>
                :
                <EmptyState
                    iconSize={50}
                    icon={LayoutGrid}
                    message="No activity recorded."
                />
            }
        </div>
    );
}
