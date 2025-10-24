import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {JobCard} from "@/lib/client/components/admin/JobCard";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {adminCheckActiveJobs} from "@/lib/client/react-query/query-options/admin-options";


export const Route = createFileRoute("/_admin/admin/active-tasks")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(adminCheckActiveJobs()),
    component: AdminActiveTasksPage,
})


function AdminActiveTasksPage() {
    const activeJobs = useSuspenseQuery(adminCheckActiveJobs()).data;

    const formatCamelCase = (str: string) => {
        const withSpaces = str.replace(/([A-Z])/g, " $1");
        return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).trim();
    };

    return (
        <DashboardShell>
            <DashboardHeader heading="Active Tasks" description="Observe all currently queued and running tasks."/>
            <div>
                {activeJobs.length === 0 ?
                    <p className="text-center text-muted-foreground p-8">
                        No tasks are currently queued or running.
                    </p>
                    :
                    <div className="space-y-4">
                        {activeJobs.map((job) =>
                            <JobCard
                                job={job}
                                key={job.id}
                                title={formatCamelCase(job.name)}
                                queryKey={adminCheckActiveJobs().queryKey}
                            />
                        )}
                    </div>
                }
            </div>
        </DashboardShell>
    )
}
