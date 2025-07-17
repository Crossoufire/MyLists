import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {TasksManager} from "@/lib/components/admin/TasksManager";
import {DashboardShell} from "@/lib/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/components/admin/DashboardHeader";
import {adminTasksOptions} from "@/lib/react-query/query-options/admin-options";


export const Route = createFileRoute("/_admin/admin/_layout/tasks")({
    loader: async ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(adminTasksOptions());
    },
    component: AdminTasksPage,
})


function AdminTasksPage() {
    const tasksList = useSuspenseQuery(adminTasksOptions()).data;

    return (
        <DashboardShell>
            <DashboardHeader heading="Long Running Tasks" description="Manage and execute maintenance and background tasks."/>
            <TasksManager
                tasksList={tasksList}
            />
        </DashboardShell>
    )
}
