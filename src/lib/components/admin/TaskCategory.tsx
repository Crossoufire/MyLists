import {Play} from "lucide-react";
import {Button} from "@/lib/components/ui/button";
import {Progress} from "@/lib/components/ui/progress";
import type {TaskStatus} from "@/lib/components/admin/TasksManager";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/components/ui/card";


interface TaskCategoryProps {
    category: any
    runningTasks: Record<string, TaskStatus>
    onStartTask: (taskId: string, taskName: string) => void
}


export function TaskCategory({ category, runningTasks, onStartTask }: TaskCategoryProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {category.tasks.map((task: any) => {
                        const isRunning = !!runningTask;
                        const runningTask = runningTasks[task.id];
                        const isCompleted = runningTask?.status === "completed";

                        return (
                            <div key={task.id} className="rounded-lg border p-4">
                                <div className="flex flex-col h-full">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-medium">{task.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2 text-xs text-muted-foreground">Estimated time: {task.estimatedTime}</div>

                                    <div className="mt-auto pt-4 flex items-center justify-between">
                                        {isRunning ? (
                                            <div className="w-full">
                                                <Progress value={runningTask.progress} className="h-2"/>
                                                <div className="mt-1 text-xs text-right">
                                                    {isCompleted ? "Completed" : `${runningTask.progress}%`}
                                                </div>
                                            </div>
                                        ) : (
                                            <Button size="sm" onClick={() => onStartTask(task.id, task.name)} className="ml-auto">
                                                <Play className="mr-2 h-3 w-3"/>
                                                Run Task
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
