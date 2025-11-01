import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {TaskCard} from "@/lib/client/components/admin/TaskCard";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {adminArchivedTasksOptions} from "@/lib/client/react-query/query-options/admin-options";


export const Route = createFileRoute("/_admin/admin/archived-tasks")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(adminArchivedTasksOptions()),
    component: AdminArchivedTasksPage,
})


function AdminArchivedTasksPage() {
    const archivedTasks = useSuspenseQuery(adminArchivedTasksOptions()).data;

    return (
        <DashboardShell>
            <DashboardHeader heading="Archived Tasks" description="Manage and execute maintenance and background tasks."/>
            <div>
                {archivedTasks.length === 0 ?
                    <p className="text-center text-muted-foreground p-8">
                        No archived tasks yet.
                    </p>
                    :
                    <div className="space-y-4">
                        {archivedTasks.map((task) =>
                            <TaskCard
                                task={task}
                                key={task.id}
                            />
                        )}
                    </div>
                }
            </div>
        </DashboardShell>
    );
}
