import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {TasksManager} from "@/lib/client/components/admin/TasksManager";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {adminTasksOptions} from "@/lib/client/react-query/query-options/admin-options";


export const Route = createFileRoute("/_admin/admin/tasks")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(adminTasksOptions()),
    component: AdminTasksPage,
})


function AdminTasksPage() {
    const tasksList = useSuspenseQuery(adminTasksOptions()).data;

    return (
        <DashboardShell>
            <DashboardHeader
                heading="Long Running Tasks"
                description="Manage and execute maintenance and background tasks."
            />
            <TasksManager
                tasksList={tasksList}
            />
        </DashboardShell>
    )
}
