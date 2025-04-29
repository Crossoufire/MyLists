import {useState} from "react";
import {TaskHistory} from "@/lib/components/tasks/task-history";
import {TaskCategory} from "@/lib/components/tasks/task-category";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";


const taskCategories = [
    {
        id: "user-tasks",
        name: "User Tasks",
        description: "Tasks related to user management and data",
        tasks: [
            {
                id: "create-demo-user",
                name: "Create Demo User Account",
                description: "Creates a new demo user account with sample data",
                estimatedTime: "30 seconds",
            },
            {
                id: "seed-achievements",
                name: "Seed Database with Achievements",
                description: "Populates the database with default achievement definitions",
                estimatedTime: "1 minute",
            },
            {
                id: "update-achievements",
                name: "Update All User Achievements",
                description: "Recalculates and updates achievements for all users",
                estimatedTime: "5-10 minutes",
            },
            {
                id: "compute-time-spent",
                name: "Compute Media Time Spent",
                description: "Calculate time spent per user and per media type",
                estimatedTime: "3-5 minutes",
            },
            {
                id: "compute-user-stats",
                name: "Compute User Stats",
                description: "Calculate user statistics per media type",
                estimatedTime: "2-4 minutes",
            },
        ],
    },
    {
        id: "media-tasks",
        name: "Media Tasks",
        description: "Tasks related to media management and cleanup",
        tasks: [
            {
                id: "remove-non-list-media",
                name: "Remove Non-List Media",
                description: "Removes media items that aren't in any user lists",
                estimatedTime: "2-5 minutes",
            },
            {
                id: "remove-unused-covers",
                name: "Remove Unused Media Covers",
                description: "Deletes cover images for media that no longer exists",
                estimatedTime: "1-3 minutes",
            },
            {
                id: "add-media-notifications",
                name: "Add New Media Notifications",
                description: "Sends notifications to users about new media additions",
                estimatedTime: "1-2 minutes",
            },
            {
                id: "lock-unavailable-media",
                name: "Lock Unavailable Media",
                description: "Locks media that are not available in the provider",
                estimatedTime: "2-4 minutes",
            },
            {
                id: "lock-old-movies",
                name: "Lock Old Movies",
                description: "Locks movies that are older than the configured threshold",
                estimatedTime: "1-2 minutes",
            },
            {
                id: "update-igdb-token",
                name: "Update IGDB Token",
                description: "Refreshes the IGDB API access token",
                estimatedTime: "10 seconds",
            },
        ],
    },
    {
        id: "database-tasks",
        name: "Database Tasks",
        description: "Database maintenance and optimization tasks",
        tasks: [
            {
                id: "analyze-db",
                name: "Analyze Database",
                description: "Analyzes the database structure and performance",
                estimatedTime: "1-3 minutes",
            },
            {
                id: "vacuum-db",
                name: "Vacuum Database",
                description: "Reclaims storage and optimizes the database",
                estimatedTime: "5-15 minutes",
            },
            {
                id: "update-platform-stats",
                name: "Update Platform Stats",
                description: "Recalculates platform-wide statistics",
                estimatedTime: "2-4 minutes",
            },
        ],
    },
    {
        id: "system-tasks",
        name: "System Tasks",
        description: "System maintenance and scheduled tasks",
        tasks: [
            {
                id: "run-scheduled-tasks",
                name: "Run All Scheduled Tasks",
                description: "Executes all pending scheduled tasks",
                estimatedTime: "10-30 minutes",
            },
        ],
    },
]

export function TasksManager() {
    const [activeTab, setActiveTab] = useState("tasks")
    const [taskHistory, setTaskHistory] = useState<TaskHistoryItem[]>([])
    const [runningTasks, setRunningTasks] = useState<Record<string, TaskStatus>>({})
    const runningTasksLength = Object.keys(runningTasks).length;

    const startTask = (taskId: string, taskName: string) => {
        // Don't start if already running
        if (runningTasks[taskId]?.status === "running") return

        // Create a new task status
        const newTask: TaskStatus = {
            id: taskId,
            name: taskName,
            status: "running",
            progress: 0,
            startTime: new Date(),
            logs: [`[${new Date().toLocaleTimeString()}] Starting task: ${taskName}`],
        }

        // Update running tasks
        setRunningTasks((prev) => ({
            ...prev,
            [taskId]: newTask,
        }))

        // Simulate task progress
        simulateTaskProgress(taskId, taskName)
    }

    const simulateTaskProgress = (taskId: string, taskName: string) => {
        // Random duration between 5-15 seconds for demo purposes
        const totalDuration = Math.floor(Math.random() * 10000) + 5000
        const intervalTime = 500
        const steps = totalDuration / intervalTime
        let currentStep = 0

        const interval = setInterval(() => {
            currentStep++
            const progress = Math.min(Math.floor((currentStep / steps) * 100), 100)

            // Add a log entry occasionally
            if (currentStep % 4 === 0 || progress === 100) {
                const logMessage =
                    progress < 100
                        ? `[${new Date().toLocaleTimeString()}] Progress: ${progress}%`
                        : `[${new Date().toLocaleTimeString()}] Task completed successfully`

                setRunningTasks((prev) => ({
                    ...prev,
                    [taskId]: {
                        ...prev[taskId],
                        progress,
                        logs: [...prev[taskId].logs, logMessage],
                        status: progress === 100 ? "completed" : "running",
                        endTime: progress === 100 ? new Date() : undefined,
                    },
                }))
            }
            else {
                setRunningTasks((prev) => ({
                    ...prev,
                    [taskId]: {
                        ...prev[taskId],
                        progress,
                    },
                }))
            }

            // When task is complete
            if (progress === 100) {
                clearInterval(interval)

                // Add to history
                const task = runningTasks[taskId]
                const endTime = new Date()
                const duration = endTime.getTime() - task.startTime.getTime()

                setTaskHistory((prev) => [
                    {
                        id: taskId,
                        name: taskName,
                        status: "completed",
                        startTime: task.startTime,
                        endTime,
                        duration,
                        logs: task.logs,
                    },
                    ...prev,
                ])

                // Remove from running tasks after a delay
                setTimeout(() => {
                    setRunningTasks((prev) => {
                        const newTasks = { ...prev }
                        delete newTasks[taskId]
                        return newTasks
                    })
                }, 3000)
            }
        }, intervalTime)
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="tasks" onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="tasks">Available Tasks</TabsTrigger>
                    <TabsTrigger value="running">
                        Running Tasks
                        {runningTasksLength > 0 && (
                            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                {runningTasksLength}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        Task History
                        {taskHistory.length > 0 && (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                                {taskHistory.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="tasks" className="space-y-6 pt-4">
                    {taskCategories.map((category) =>
                        <TaskCategory
                            key={category.id}
                            category={category}
                            onStartTask={startTask}
                            runningTasks={runningTasks}
                        />
                    )}
                </TabsContent>
                <TabsContent value="running" className="pt-4">
                    {Object.keys(runningTasks).length === 0 ? (
                        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                            <p className="text-muted-foreground">No tasks are currently running</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.values(runningTasks).map((task) => (
                                <TaskCard key={task.id} task={task}/>
                            ))}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="history" className="pt-4">
                    <TaskHistory history={taskHistory}/>
                </TabsContent>
            </Tabs>
        </div>
    )
}


export interface Task {
    id: string
    name: string
    description: string
    estimatedTime: string
}


export interface TaskCategoryProps {
    id: string
    name: string
    description: string
    tasks: Task[]
}


export interface TaskStatus {
    id: string
    name: string
    status: "queued" | "running" | "completed" | "failed"
    progress: number
    startTime: Date
    endTime?: Date
    logs: string[]
}


export interface TaskHistoryItem {
    id: string
    name: string
    status: "completed" | "failed"
    startTime: Date
    endTime: Date
    duration: number
    logs: string[]
}


function TaskCard({ task }: { task: TaskStatus }) {
    const [showLogs, setShowLogs] = useState(false)

    return (
        <div className="rounded-lg border">
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium">{task.name}</h3>
                    <div className="flex items-center gap-2">
            <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    task.status === "running"
                        ? "bg-blue-100 text-blue-800"
                        : task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                }`}
            >
              {task.status === "running" ? "Running" : task.status === "completed" ? "Completed" : "Queued"}
            </span>
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            {showLogs ? "Hide logs" : "Show logs"}
                        </button>
                    </div>
                </div>

                <div className="mt-2">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-full rounded-full bg-muted">
                            <div
                                className={`h-2 rounded-full ${task.status === "completed" ? "bg-green-500" : "bg-blue-500"}`}
                                style={{ width: `${task.progress}%` }}
                            />
                        </div>
                        <span className="text-sm">{task.progress}%</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Started: {task.startTime.toLocaleTimeString()}
                        {task.endTime && ` • Completed: ${task.endTime.toLocaleTimeString()}`}
                    </div>
                </div>

                {showLogs && (
                    <div className="mt-4 max-h-40 overflow-auto rounded border bg-muted/50 p-2">
            <pre className="text-xs">
              {task.logs.map((log, i) => (
                  <div key={i}>{log}</div>
              ))}
            </pre>
                    </div>
                )}
            </div>
        </div>
    )
}
