import {useState} from "react";
import {cn} from "@/lib/utils/helpers";
import {Badge} from "@/lib/client/components/ui/badge";
import {Button} from "@/lib/client/components/ui/button";
import {capitalize, formatDateTime} from "@/lib/utils/functions";
import {CheckCircle, Clock, Info, TriangleAlert, XCircle} from "lucide-react";
import {Card, CardContent, CardHeader} from "@/lib/client/components/ui/card";
import {adminArchivedTasksOptions} from "@/lib/client/react-query/query-options/admin-options";


type TaskType = Awaited<ReturnType<NonNullable<ReturnType<typeof adminArchivedTasksOptions>["queryFn"]>>>[0];


export function TaskCard({ task }: { task: TaskType }) {
    const [showLogs, setShowLogs] = useState(false);

    const getTaskStatusColor = (taskStatus: string) => {
        switch (taskStatus) {
            case "completed":
                return "bg-green-900";
            case "failed":
                return "bg-red-900";
        }
    };

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">
                        {task.taskName}
                    </h2>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                        TaskId: {task.id} {task.userId && `- UserId: ${task.userId}`}
                    </Badge>
                </div>
                <div>
                    <Badge className={cn("text-white font-medium px-3 py-1", getTaskStatusColor(task.status))}>
                        {capitalize(task.status)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <div className="text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5"/>
                            <span>Started</span>
                        </div>
                        <div className="text-zinc-200">
                            {formatDateTime(task.startedAt, { seconds: true })}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-zinc-400 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5"/>
                            <span>Finished</span>
                        </div>
                        <div className="text-zinc-200">
                            {formatDateTime(task.finishedAt, { seconds: true })}
                        </div>
                    </div>
                </div>
                {task.logs &&
                    <div className="mt-3 -mb-1">
                        <Button onClick={() => setShowLogs(!showLogs)} variant="outline" size="sm">
                            {showLogs ? "Hide Logs" : `Show Logs - (${task.logs.length})`}
                        </Button>
                        {showLogs &&
                            <LogViewer logsData={task.logs}/>
                        }
                    </div>
                }
            </CardContent>
        </Card>
    );
}


function LogViewer({ logsData }: { logsData: TaskType["logs"] }) {
    const [expandedLogs, setExpandedLogs] = useState(() => new Set<number>());

    const toggleExpanded = (idx: number) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(idx)) {
            newExpanded.delete(idx);
        }
        else {
            newExpanded.add(idx);
        }
        setExpandedLogs(newExpanded);
    };

    const getLevelInfo = (level: number) => {
        if (level >= 50) {
            return { label: "ERROR", color: "text-red-400", icon: XCircle };
        }
        else if (level >= 40) {
            return { label: "WARN", color: "text-yellow-400", icon: TriangleAlert };
        }
        else {
            return { label: "INFO", color: "text-blue-400", icon: Info };
        }
    };

    return (
        <div className="overflow-auto max-h-[400px] pr-2">
            {logsData.map((log, idx) => {
                const levelInfo = getLevelInfo(log.level);
                const Icon = levelInfo.icon;
                const isExpanded = expandedLogs.has(idx);

                return (
                    <div
                        key={idx}
                        className="border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900 transition-colors bg-opacity-5"
                    >
                        <div className="px-3 py-2 flex items-start gap-2">
                            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${levelInfo.color}`}/>

                            <div className="flex-1 min-w-0" onClick={() => toggleExpanded(idx)}>
                                <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className={`text-xs font-semibold ${levelInfo.color}`}>
                                                {levelInfo.label}
                                            </span>
                                            {log.time &&
                                                <span className="text-xs text-zinc-500 font-mono">
                                                    {formatDateTime(log.time, { seconds: true })}
                                                </span>
                                            }
                                            {log.durationMs &&
                                                <span className="text-xs text-zinc-500 font-mono">
                                                    [{log.durationMs} ms]
                                                </span>
                                            }
                                            <span className="text-sm text-zinc-200 break-words">
                                                {log.msg}
                                            </span>
                                        </div>

                                        {(isExpanded && log.err) &&
                                            <div className="mt-2 p-2 bg-zinc-900 rounded text-xs font-mono overflow-auto">
                                                <pre className="text-zinc-300 whitespace-pre-wrap break-words">
                                                    {JSON.stringify(Object.fromEntries(Object.entries(log.err)), null, 4)}
                                                </pre>
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
