import {toast} from "sonner";
import {Loader2, Play} from "lucide-react";
import {useQuery} from "@tanstack/react-query";
import {TasksName} from "@/lib/types/tasks.types";
import {Button} from "@/lib/client/components/ui/button";
import {JobCard} from "@/lib/client/components/admin/JobCard";
import {taskDefinitions} from "@/lib/server/domain/tasks/tasks-config";
import {CompletedJobs} from "@/lib/client/components/admin/CompletedJobs";
import {adminJobsOptions} from "@/lib/client/react-query/query-options/admin-options";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs";
import {useAdminTriggerTaskMutation} from "@/lib/client/react-query/query-mutations/admin.mutations";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


interface TasksManagerProps {
    tasksList: typeof taskDefinitions;
}


export function TasksManager({ tasksList }: TasksManagerProps) {
    const taskTriggerMutation = useAdminTriggerTaskMutation();
    const { data: currentJobs = [], isLoading, error } = useQuery(adminJobsOptions());

    const activeTaskNames = new Set(currentJobs.map((job) => job.name));

    const executeTask = (taskName: TasksName) => {
        taskTriggerMutation.mutate({ data: { taskName } }, {
            onError: (error) => toast.error(`Failed to execute ${taskName}: ${error.message}`),
            onSuccess: () => toast.success(`Task ${taskName} enqueued`),
        })
    };

    const formatCamelCase = (str: string) => {
        const withSpaces = str.replace(/([A-Z])/g, " $1");
        return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).trim();
    };

    return (
        <Tabs defaultValue="tasks" className="w-full">
            <TabsList>
                <TabsTrigger value="tasks">Available Tasks</TabsTrigger>
                <TabsTrigger value="running">Running Tasks</TabsTrigger>
                <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="space-y-6 pt-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tasksList.map((task) => {
                        const isRunning = activeTaskNames.has(task.name);
                        const isMutating = taskTriggerMutation.isPending && taskTriggerMutation.variables.data.taskName === task.name;
                        const isDisabled = isRunning || isMutating || isLoading;

                        return (
                            <Card key={task.name}>
                                <CardHeader>
                                    <CardTitle>{formatCamelCase(task.name)}</CardTitle>
                                    <CardDescription>{task.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button size="sm" disabled={isDisabled} onClick={() => executeTask(task.name)}>
                                        {isDisabled ? <Loader2 className="size-4 animate-spin"/> : <Play className="size-4"/>}
                                        {isRunning ? "Running" : "Run Task"}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </TabsContent>
            <TabsContent value="running" className="pt-4">
                {isLoading &&
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                        <span className="ml-2">Loading current jobs...</span>
                    </div>
                }
                {error && <div>Could not load running/queued jobs: {error.message}</div>}
                {!isLoading && !error && currentJobs.length === 0 &&
                    <p className="text-center text-muted-foreground p-8">
                        No tasks are currently running or queued.
                    </p>
                }
                {!isLoading && !error && currentJobs.length > 0 &&
                    <div className="space-y-4">
                        {currentJobs.map((job) =>
                            <JobCard
                                job={job}
                                key={job.id}
                            />
                        )}
                    </div>
                }
            </TabsContent>
            <TabsContent value="completed" className="pt-4">
                <CompletedJobs/>
            </TabsContent>
        </Tabs>
    )
}
