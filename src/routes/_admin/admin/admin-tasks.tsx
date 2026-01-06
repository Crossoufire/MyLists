import {toast} from "sonner";
import {Loader2, Play} from "lucide-react";
import {TaskName} from "@/lib/server/tasks/registry";
import {formatCamelCase} from "@/lib/utils/formating";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {TaskFormDialog} from "@/lib/client/components/admin/TaskDialogForm";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {adminTasksOptions} from "@/lib/client/react-query/query-options/admin-options";
import {useAdminTriggerTaskMutation} from "@/lib/client/react-query/query-mutations/admin.mutations";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


export const Route = createFileRoute("/_admin/admin/admin-tasks")({
    loader: async ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(adminTasksOptions);
    },
    component: AdminTasksPage,
});


export type InputSchema = {
    type: string;
    required: string[];
    properties: Record<string, {
        type: string;
        default?: any;
        enum?: string[];
        format?: string;
        pattern?: string;
        description?: string;
    }>;
};


export type TaskItem = {
    name: string;
    description: string;
    inputSchema: InputSchema;
}


function AdminTasksPage() {
    const taskTriggerMutation = useAdminTriggerTaskMutation();
    const tasksList = useSuspenseQuery(adminTasksOptions).data;

    const hasInputFields = (task: TaskItem) => {
        return Object.keys(task.inputSchema.properties).length > 0;
    };

    const executeTask = (taskName: TaskName, input = {}) => {
        taskTriggerMutation.mutate({ data: { taskName, input } }, {
            onError: () => toast.error(`Task ${taskName} Failed`),
            onSuccess: () => toast.success(`Task ${taskName} Completed`),
        });
    };

    return (
        <DashboardShell>
            <DashboardHeader heading="Admin Tasks" description="Manage and execute maintenance and background tasks."/>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasksList.map((task) => {
                    const isRunning = taskTriggerMutation.isPending && taskTriggerMutation.variables.data.taskName === task.name;

                    return (
                        <Card key={task.name}>
                            <CardHeader>
                                <CardTitle>{formatCamelCase(task.name)}</CardTitle>
                                <CardDescription>{task.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {hasInputFields(task) ?
                                    <TaskFormDialog
                                        task={task}
                                        isRunning={isRunning}
                                        onSubmit={(input) => executeTask(task.name as TaskName, input)}
                                    />
                                    :
                                    <Button
                                        size="sm"
                                        disabled={isRunning}
                                        onClick={() => executeTask(task.name as TaskName, {})}
                                    >
                                        {isRunning ? <Loader2 className="size-4 animate-spin"/> : <Play className="size-4"/>}
                                        {isRunning ? "Running" : "Run Task"}
                                    </Button>
                                }
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </DashboardShell>
    );
}
