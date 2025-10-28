import {toast} from "sonner";
import {cn} from "@/lib/utils/helpers";
import {CheckCircle, Clock} from "lucide-react";
import {JobProgress} from "@/lib/types/tasks.types";
import {Badge} from "@/lib/client/components/ui/badge";
import {Button} from "@/lib/client/components/ui/button";
import {capitalize, formatDateTime} from "@/lib/utils/functions";
import {Card, CardContent, CardHeader} from "@/lib/client/components/ui/card";
import {useCancelUploadsMutation} from "@/routes/_main/_private/settings/uploads/route";
import {adminArchivedTasksOptions, adminCheckActiveJobs} from "@/lib/client/react-query/query-options/admin-options";


type TaskType = Awaited<ReturnType<NonNullable<ReturnType<typeof adminCheckActiveJobs>["queryFn"]>>>[0]
    | Awaited<ReturnType<NonNullable<ReturnType<typeof adminArchivedTasksOptions>["queryFn"]>>>[0];


interface JobCardProps {
    job: TaskType;
    title: string;
    queryKey: any;
    isAdmin?: boolean;
}


export function JobCard({ job, title, queryKey, isAdmin = true }: JobCardProps) {
    const cancelUploadsMutation = useCancelUploadsMutation(queryKey);
    const jobStatus = job.returnValue?.result === "cancelled" ? "cancelled" : job.status;

    const handleCancel = () => {
        cancelUploadsMutation.mutate({ data: { jobId: job.jobId! } }, {
            onSuccess: () => toast.success("Upload cancelled successfully"),
        });
    }

    const getProgress = () => {
        if (jobStatus !== "active" || !("progress" in job) || ("progress" in job && typeof job.progress !== "object")) {
            return false;
        }

        const progress = job.progress as JobProgress;
        return {
            message: progress.message,
            percentage: progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0,
        };
    };

    const getJobStatusColor = (jobStatus: string) => {
        switch (jobStatus) {
            case "active":
                return "bg-blue-900";
            case "waiting":
                return "bg-yellow-900";
            case "completed":
                return "bg-green-900";
            case "failed":
                return "bg-red-900";
            case "cancelled":
                return "bg-gray-700";
        }
    };

    const progress = getProgress();

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">
                        {title}
                    </h2>
                    {isAdmin &&
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                            JobId: {job.jobId} {(job.data && "userId" in job.data) && `- UserId: ${job.data.userId}`}
                        </Badge>
                    }
                </div>
                <div>
                    {jobStatus === "active" ?
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={cancelUploadsMutation.isPending}
                        >
                            {cancelUploadsMutation.isPending ? "Cancelling..." : "Cancel"}
                        </Button>
                        :
                        <Badge className={cn("text-white font-medium px-3 py-1", getJobStatusColor(jobStatus))}>
                            {capitalize(jobStatus)}
                        </Badge>
                    }
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <div className="text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5"/>
                            <span>Queued</span>
                        </div>
                        <div className="text-zinc-200">
                            {formatDateTime(job.timestamp / 1000)}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5"/>
                            <span>Started</span>
                        </div>
                        <div className="text-zinc-200">
                            {formatDateTime(job.processedOn ? job.processedOn / 1000 : job.processedOn)}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-zinc-400 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5"/>
                            <span>Finished</span>
                        </div>
                        <div className="text-zinc-200">
                            {formatDateTime(job.finishedOn ? job.finishedOn / 1000 : job.finishedOn)}
                        </div>
                    </div>
                </div>

                {(jobStatus === "active" && !!progress) &&
                    <div className="space-y-2 mt-3">
                        <div className="flex justify-between text-sm">
                            <span className="truncate">{progress.message}</span>
                            <span>{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                style={{ width: `${progress.percentage}%` }}
                                className="bg-blue-500 h-2 rounded-full transition-all"
                            />
                        </div>
                    </div>
                }

                {jobStatus === "failed" &&
                    <div className="mt-2 text-red-700 truncate">
                        <strong>Failed</strong> - Sorry the job failed. Please try again later.
                    </div>
                }

                {isAdmin && "logs" in job && job.logs &&
                    <div className="mt-2 ">
                        {job.logs.logs}
                    </div>
                }
            </CardContent>
        </Card>
    );
}


// interface ParsedLog {
//     msg: string;
//     raw: string;
//     level: number;
//     durationMs?: number,
//     time: number | null;
//     data: Record<string, any> | null;
// }
//
//
// function LogViewer({ logsData }: { logsData: string[] }) {
//     const [expandedLogs, setExpandedLogs] = useState(() => new Set<number>());
//
//     const parseLogLine = (logLine: string): ParsedLog => {
//         try {
//             const parsed = JSON.parse(logLine);
//             return {
//                 raw: logLine,
//                 msg: parsed.msg,
//                 time: parsed.time,
//                 level: parsed.level,
//                 data: { ...parsed },
//                 durationMs: parsed.durationMs,
//             };
//         }
//         catch {
//             return {
//                 level: 30,
//                 time: null,
//                 data: null,
//                 msg: logLine,
//                 raw: logLine,
//             };
//         }
//     };
//
//     const getLevelInfo = (level: number) => {
//         if (level >= 50) {
//             return { label: "ERROR", color: "text-red-400", icon: XCircle };
//         }
//         else if (level >= 40) {
//             return { label: "WARN", color: "text-yellow-400", icon: AlertCircle };
//         }
//         else {
//             return { label: "INFO", color: "text-blue-400", icon: Info };
//         }
//     };
//
//     const formatTime = (time: number | null) => {
//         if (!time) return "";
//         const date = new Date(time);
//
//         return date.toLocaleTimeString("fr", {
//             hour12: false,
//             hour: "2-digit",
//             minute: "2-digit",
//             second: "2-digit",
//             fractionalSecondDigits: 3,
//         });
//     };
//
//     const toggleExpanded = (idx: number) => {
//         const newExpanded = new Set(expandedLogs);
//         if (newExpanded.has(idx)) {
//             newExpanded.delete(idx);
//         }
//         else {
//             newExpanded.add(idx);
//         }
//         setExpandedLogs(newExpanded);
//     };
//
//     const hasAdditionalData = (log: ParsedLog) => {
//         if (!log.data || log.level < 40) return false;
//
//         const keys = Object.keys(log.data);
//         const standardKeys = ["level", "time", "msg", "pid", "hostname"];
//
//         return keys.some((key) => !standardKeys.includes(key));
//     };
//
//     return (
//         <div className="overflow-auto max-h-[500px]">
//             {logsData.map((logLine, idx) => {
//                 const log = parseLogLine(logLine);
//                 const levelInfo = getLevelInfo(log.level);
//                 const Icon = levelInfo.icon;
//                 const isExpanded = expandedLogs.has(idx);
//                 const showExpandButton = hasAdditionalData(log);
//
//                 return (
//                     <div
//                         key={idx}
//                         className="border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900 transition-colors bg-opacity-5"
//                     >
//                         <div className="px-3 py-2 flex items-start gap-2">
//                             <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${levelInfo.color}`}/>
//
//                             <div className="flex-1 min-w-0">
//                                 <div className="flex items-start gap-2">
//                                     {showExpandButton &&
//                                         <button
//                                             type="button"
//                                             onClick={() => toggleExpanded(idx)}
//                                             className="text-zinc-500 hover:text-zinc-300 mt-0.5"
//                                         >
//                                             {isExpanded ? <ChevronDown className="size-3"/> : <ChevronRight className="size-3"/>}
//                                         </button>
//                                     }
//
//                                     <div className="flex-1">
//                                         <div className="flex items-baseline gap-2 flex-wrap">
//                                             <span className={`text-xs font-semibold ${levelInfo.color}`}>
//                                                 {levelInfo.label}
//                                             </span>
//                                             {log.time &&
//                                                 <span className="text-xs text-zinc-500 font-mono">
//                                                     {formatTime(log.time)}
//                                                 </span>
//                                             }
//                                             {log.durationMs &&
//                                                 <span className="text-xs text-zinc-500 font-mono">
//                                                     [{log.durationMs} ms]
//                                                 </span>
//                                             }
//                                             <span className="text-sm text-zinc-200 break-words">
//                                                 {log.msg}
//                                             </span>
//                                         </div>
//
//                                         {isExpanded && log.data && log.level >= 30 &&
//                                             <div className="mt-2 p-2 bg-zinc-900 rounded text-xs font-mono overflow-auto">
//                                                 <pre className="text-zinc-300 whitespace-pre-wrap break-words">
//                                                     {JSON.stringify(
//                                                         Object.fromEntries(
//                                                             Object.entries(log.data).filter(
//                                                                 ([key]) => !["level", "time", "msg", "pid", "hostname"].includes(key)
//                                                             )
//                                                         ), null, 2
//                                                     )}
//                                                 </pre>
//                                             </div>
//                                         }
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 );
//             })}
//         </div>
//     );
// }
