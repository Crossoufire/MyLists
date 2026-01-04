import {useState} from "react";
import {cn} from "@/lib/utils/helpers";
import {Badge} from "@/lib/client/components/ui/badge";
import {TaskType} from "@/lib/types/query.options.types";
import {Button} from "@/lib/client/components/ui/button";
import {CheckCircle, Clock, Info, Trash} from "lucide-react";
import {capitalize, formatDateTime} from "@/lib/utils/formating";
import {LogViewer} from "@/lib/client/components/admin/LogViewer";
import {useAdminDeleteTaskMutation} from "@/lib/client/react-query/query-mutations/admin.mutations";
import {Card, CardAction, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


export function TaskCard({ task }: { task: TaskType }) {
    const deleteTaskMutation = useAdminDeleteTaskMutation();
    const [showLogs, setShowLogs] = useState(false);

    const getTaskStatusColor = (taskStatus: string) => {
        switch (taskStatus) {
            case "completed":
                return "bg-green-900";
            case "failed":
                return "bg-red-900";
        }
    };

    const handleDeleteTask = () => {
        deleteTaskMutation.mutate({ data: { taskId: task.taskId } });
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>
                    {task.taskName}
                </CardTitle>
                <CardAction>
                    <div className="flex items-center gap-3">
                        <Badge className={cn("text-primary font-medium px-3 py-1", getTaskStatusColor(task.status))}>
                            {capitalize(task.status)}
                        </Badge>
                        <Button onClick={handleDeleteTask} size="xs" variant="destructive">
                            <Trash className="size-4"/>
                        </Button>
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
                    <div className="flex flex-col gap-1">
                        <div className="text-muted-foreground flex items-center gap-1">
                            <Info className="size-3.5"/> Id
                        </div>
                        <div>
                            TaskId: {task.id} {task.userId && `- UserId: ${task.userId}`}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3.5"/> Started
                        </div>
                        <div>
                            {formatDateTime(task.startedAt, { seconds: true })}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="size-3.5"/> Finished
                        </div>
                        <div>
                            {formatDateTime(task.finishedAt, { seconds: true })}
                        </div>
                    </div>
                </div>
                {task.logs &&
                    <div className="mt-4">
                        <Button onClick={() => setShowLogs(!showLogs)} variant="outline" size="sm">
                            {showLogs ? "Hide Logs" : `Show Logs - (${task.logs.length})`}
                        </Button>
                        {showLogs &&
                            <LogViewer
                                logsData={task.logs}
                            />
                        }
                    </div>
                }
            </CardContent>
        </Card>
    );
}
