import {toast} from "sonner";
import {Loader2, Play} from "lucide-react";
import {TaskDefinition} from "@/lib/types/tasks.types";
import {createFileRoute} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {useSuspenseQuery} from "@tanstack/react-query";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {adminTasksOptions} from "@/lib/client/react-query/query-options/admin-options";
import {useAdminTriggerTaskMutation} from "@/lib/client/react-query/query-mutations/admin.mutations";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


export const Route = createFileRoute("/_admin/admin/admin-tasks")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(adminTasksOptions()),
    component: AdminTasksPage,
})


function AdminTasksPage() {
    const taskTriggerMutation = useAdminTriggerTaskMutation();
    const tasksList = useSuspenseQuery(adminTasksOptions()).data;

    const formatCamelCase = (str: string) => {
        const withSpaces = str.replace(/([A-Z])/g, " $1");
        return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).trim();
    };

    const executeTask = (taskName: TaskDefinition["name"]) => {
        taskTriggerMutation.mutate({ data: { taskName } }, {
            onError: () => toast.error(`Task ${taskName} Failed`),
            onSuccess: () => toast.success(`Task ${taskName} Completed`),
        });
    };

    return (
        <DashboardShell>
            <DashboardHeader heading="Admin Tasks" description="Manage and execute maintenance and background tasks."/>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasksList.map((task) => {
                    const isDisabled = taskTriggerMutation.isPending && taskTriggerMutation.variables.data.taskName === task.name;

                    return (
                        <Card key={task.name}>
                            <CardHeader>
                                <CardTitle>{formatCamelCase(task.name)}</CardTitle>
                                <CardDescription>{task.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button size="sm" disabled={isDisabled} onClick={() => executeTask(task.name)}>
                                    {isDisabled ? <Loader2 className="size-4 animate-spin"/> : <Play className="size-4"/>}
                                    {isDisabled ? "Running" : "Run Task"}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </DashboardShell>
    );
}
