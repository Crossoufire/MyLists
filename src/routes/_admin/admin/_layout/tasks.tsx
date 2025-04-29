import {createFileRoute} from "@tanstack/react-router";
import {TasksManager} from "@/lib/components/admin/TasksManager";
import {DashboardShell} from "@/lib/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/components/admin/DashboardHeader";


export const Route = createFileRoute("/_admin/admin/_layout/tasks")({
    loader: async ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(adminTasksOptions());
    },
    component: AdminTasksPage,
})


function AdminTasksPage() {
    return (
        <DashboardShell>
            <DashboardHeader heading="Long Running Tasks" description="Manage and execute maintenance and background tasks."/>
            <TasksManager/>
        </DashboardShell>
    )
}
