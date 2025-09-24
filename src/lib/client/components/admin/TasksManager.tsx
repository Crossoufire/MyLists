import {toast} from "sonner";
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Badge} from "@/lib/client/components/ui/badge";
import {TasksName} from "@/lib/types/base.types";
import {Button} from "@/lib/client/components/ui/button";
import {capitalize, formatDateTime} from "@/lib/utils/functions";
import {taskDefinitions} from "@/lib/server/domain/tasks/tasks-config";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs";
import {CheckCircle, Clock, Eye, EyeOff, Loader2, Play, Terminal} from "lucide-react";
import {useAdminTriggerTaskMutation} from "@/lib/client/react-query/query-mutations/admin.mutations";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {adminJobCompletedOptions, adminJobLogsOptions, adminJobsOptions} from "@/lib/client/react-query/query-options/admin-options";


type AdminJobCompleted = Awaited<ReturnType<NonNullable<ReturnType<typeof adminJobCompletedOptions>["queryFn"]>>>[0];


interface TasksManagerProps {
    tasksList: typeof taskDefinitions;
}


export function TasksManager({ tasksList }: TasksManagerProps) {
    const taskTriggerMutation = useAdminTriggerTaskMutation();
    const { data: currentJobs = [], isLoading, error } = useQuery(adminJobsOptions({ pollingRateSec: 10 }))

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


function CompletedJobs() {
    const { data: completedData = [], isLoading, error } = useQuery(adminJobCompletedOptions());

    return (
        <>
            {isLoading &&
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                    <span className="ml-2">Loading completed jobs...</span>
                </div>
            }
            {error && <div>Could not load completed jobs: {error.message}</div>}
            {!isLoading && !error && completedData.length === 0 &&
                <p className="text-center text-muted-foreground p-8">
                    No tasks are completed found yet.
                </p>
            }
            {!isLoading && !error && completedData.length > 0 &&
                <div className="space-y-4">
                    {completedData.sort((a, b) => {
                        const finishedA = a.finishedOn ?? Number.MIN_SAFE_INTEGER;
                        const finishedB = b.finishedOn ?? Number.MIN_SAFE_INTEGER;
                        return finishedB - finishedA;
                    }).map((job) =>
                        <JobCard
                            job={job}
                            key={job.id}
                        />
                    )}
                </div>
            }
        </>
    )
}


function JobCard({ job }: { job: AdminJobCompleted }) {
    const [showLogs, setShowLogs] = useState(false);
    const { data: logsData, isLoading, error, isFetching } = useQuery(adminJobLogsOptions(job.id, showLogs && !!job.id));

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-blue-900 text-blue-200";
            case "waiting":
                return "bg-yellow-900 text-yellow-200";
            case "completed":
                return "bg-green-900 text-green-200";
            case "failed":
                return "bg-red-900 text-red-200";
        }
    };

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{job.name}</h2>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                            Job ID: {job.id}
                        </Badge>
                    </div>
                </div>
                <Badge className={`${getStatusColor(job.status)} text-white font-medium px-3 py-1`}>
                    {capitalize(job.status)}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <div className="text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5"/>
                            <span>Queued</span>
                        </div>
                        <div className="text-zinc-200">
                            {formatDateTime(job.timestamp)}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5"/>
                            <span>Started</span>
                        </div>
                        <div className="text-zinc-200">
                            {formatDateTime(job.processedOn)}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-zinc-400 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5"/>
                            <span>Finished</span>
                        </div>
                        <div className="text-zinc-200">
                            {formatDateTime(job.finishedOn)}
                        </div>
                    </div>
                </div>
                {showLogs &&
                    <div className="mt-4 bg-zinc-950 rounded-md border border-zinc-800 p-3 font-mono text-sm">
                        <div className="flex items-center gap-2 mb-2 text-zinc-400">
                            <Terminal className="size-4"/>
                            <span>Logs</span>
                        </div>
                        <pre className="whitespace-pre-wrap break-words text-xs font-mono">
                            {(logsData && !isLoading && !error) &&
                                <pre className="whitespace-pre-wrap break-words text-xs font-mono">
                                    {logsData.logs && logsData.logs.length > 0 ?
                                        logsData.logs.join("\n") : "No logs available for this job."
                                    }
                                </pre>
                            }
                        </pre>
                    </div>
                }
            </CardContent>
            <CardFooter>
                <Button
                    size="sm"
                    disabled={!job.id}
                    onClick={() => setShowLogs(!showLogs)}
                >
                    {isFetching && <Loader2 className="ml-2 h-3 w-3 animate-spin"/>}
                    {showLogs ?
                        <><EyeOff className="h-4 w-4 mr-1"/> Hide Logs</>
                        :
                        <><Eye className="h-4 w-4 mr-1"/> Show Logs</>
                    }
                </Button>
            </CardFooter>
        </Card>
    );
}
