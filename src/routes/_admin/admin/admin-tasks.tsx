import {toast} from "sonner";
import {Loader2, Play} from "lucide-react";
import {TaskDefinition} from "@/lib/types/tasks.types";
import {createFileRoute} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {useQuery, useSuspenseQuery} from "@tanstack/react-query";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {useAdminTriggerTaskMutation} from "@/lib/client/react-query/query-mutations/admin.mutations";
import {adminCheckActiveJobs, adminTasksOptions} from "@/lib/client/react-query/query-options/admin-options";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


export const Route = createFileRoute("/_admin/admin/admin-tasks")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(adminTasksOptions()),
    component: AdminTasksPage,
})


function AdminTasksPage() {
    const taskTriggerMutation = useAdminTriggerTaskMutation();
    const tasksList = useSuspenseQuery(adminTasksOptions()).data;
    const { data: activeJobs = [], isLoading, refetch } = useQuery(adminCheckActiveJobs(3));

    const formatCamelCase = (str: string) => {
        const withSpaces = str.replace(/([A-Z])/g, " $1");
        return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).trim();
    };

    const executeTask = (taskName: TaskDefinition["name"]) => {
        taskTriggerMutation.mutate({ data: { taskName } }, {
            onSuccess: async () => {
                toast.success(`Task ${taskName} enqueued`);
                await refetch();
            },
        })
    };

    return (
        <DashboardShell>
            <DashboardHeader heading="Admin Tasks" description="Manage and execute maintenance and background tasks."/>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasksList.map((task) => {
                    const isActive = activeJobs.some((job) => job.name === task.name);
                    const waiting = activeJobs.some((job) => job.name === task.name && job.status === "waiting");
                    const isMutating = taskTriggerMutation.isPending && taskTriggerMutation.variables.data.taskName === task.name;
                    const isDisabled = isActive || isMutating || isLoading;

                    return (
                        <Card key={task.name}>
                            <CardHeader>
                                <CardTitle>{formatCamelCase(task.name)}</CardTitle>
                                <CardDescription>{task.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button size="sm" disabled={isDisabled} onClick={() => executeTask(task.name)}>
                                    {isDisabled ? <Loader2 className="size-4 animate-spin"/> : <Play className="size-4"/>}
                                    {isActive ? waiting ? "Waiting" : "Running" : "Run Task"}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </DashboardShell>
    )
}
