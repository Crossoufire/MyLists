import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Badge} from "@/lib/client/components/ui/badge";
import {Button} from "@/lib/client/components/ui/button";
import {capitalize, formatDateTime} from "@/lib/utils/functions";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {Card, CardContent, CardFooter, CardHeader} from "@/lib/client/components/ui/card";
import {adminJobCompletedOptions, adminJobLogsOptions} from "@/lib/client/react-query/query-options/admin-options";
import {AlertCircle, CheckCircle, ChevronDown, ChevronRight, Clock, Eye, EyeOff, Info, Loader2, Terminal, XCircle} from "lucide-react";


type AdminJobCompleted = Awaited<ReturnType<NonNullable<ReturnType<typeof adminJobCompletedOptions>["queryFn"]>>>[0];


export function JobCard({ job }: { job: AdminJobCompleted }) {
    const [showLogs, setShowLogs] = useState(false);
    const { data: logsData, isLoading, error, isFetching } = useQuery(adminJobLogsOptions(job.id, showLogs && !!job.id));
    const jobStatus = job.returnValue?.result === "cancelled" ? "cancelled" : job.status;

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
                <Badge className={`${getJobStatusColor(jobStatus)} text-white font-medium px-3 py-1`}>
                    {capitalize(jobStatus)}
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
                {showLogs &&
                    <div className="mt-4 bg-zinc-950 rounded-md border border-zinc-800 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Terminal className="size-4"/>
                                <span className="text-sm font-medium">Logs</span>
                            </div>
                            {logsData &&
                                <span className="text-xs text-zinc-500">
                                    {logsData.count} entries
                                </span>
                            }
                        </div>

                        {isLoading &&
                            <div className="p-4 text-sm text-zinc-500 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin"/> Loading logs...
                            </div>
                        }

                        {error &&
                            <div className="p-4 text-sm text-red-400">
                                Error loading logs: {error.toString()}
                            </div>
                        }

                        {logsData && !isLoading && !error && logsData.logs && logsData.logs.length > 0 ?
                            <LogViewer
                                logsData={logsData.logs}
                            />
                            :
                            <div className="p-4">
                                <MutedText>No logs available for this job.</MutedText>
                            </div>
                        }
                    </div>
                }
            </CardContent>
            <CardFooter>
                <Button
                    size="sm"
                    disabled={!job.id}
                    onClick={() => setShowLogs(!showLogs)}
                >
                    {isFetching && <Loader2 className="ml-2 size-3 animate-spin"/>}
                    {showLogs ?
                        <><EyeOff className="size-4 mr-1"/> Hide Logs</>
                        :
                        <><Eye className="size-4 mr-1"/> Show Logs</>
                    }
                </Button>
            </CardFooter>
        </Card>
    );
}


interface ParsedLog {
    msg: string;
    raw: string;
    level: number;
    durationMs?: number,
    time: number | null;
    data: Record<string, any> | null;
}


function LogViewer({ logsData }: { logsData: string[] }) {
    const [expandedLogs, setExpandedLogs] = useState(() => new Set<number>());

    const parseLogLine = (logLine: string): ParsedLog => {
        try {
            const parsed = JSON.parse(logLine);
            return {
                raw: logLine,
                msg: parsed.msg,
                time: parsed.time,
                level: parsed.level,
                data: { ...parsed },
                durationMs: parsed.durationMs,
            };
        }
        catch {
            return {
                level: 30,
                time: null,
                data: null,
                msg: logLine,
                raw: logLine,
            };
        }
    };

    const getLevelInfo = (level: number) => {
        if (level >= 50) {
            return { label: "ERROR", color: "text-red-400", icon: XCircle };
        }
        else if (level >= 40) {
            return { label: "WARN", color: "text-yellow-400", icon: AlertCircle };
        }
        else {
            return { label: "INFO", color: "text-blue-400", icon: Info };
        }
    };

    const formatTime = (time: number | null) => {
        if (!time) return "";
        const date = new Date(time);

        return date.toLocaleTimeString("fr", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            fractionalSecondDigits: 3,
        });
    };

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

    const hasAdditionalData = (log: ParsedLog) => {
        if (!log.data || log.level < 40) return false;

        const keys = Object.keys(log.data);
        const standardKeys = ["level", "time", "msg", "pid", "hostname"];

        return keys.some((key) => !standardKeys.includes(key));
    };

    return (
        <div className="overflow-auto max-h-[500px]">
            {logsData.map((logLine, idx) => {
                const log = parseLogLine(logLine);
                const levelInfo = getLevelInfo(log.level);
                const Icon = levelInfo.icon;
                const isExpanded = expandedLogs.has(idx);
                const showExpandButton = hasAdditionalData(log);

                return (
                    <div
                        key={idx}
                        className="border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900 transition-colors bg-opacity-5"
                    >
                        <div className="px-3 py-2 flex items-start gap-2">
                            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${levelInfo.color}`}/>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                    {showExpandButton &&
                                        <button
                                            type="button"
                                            onClick={() => toggleExpanded(idx)}
                                            className="text-zinc-500 hover:text-zinc-300 mt-0.5"
                                        >
                                            {isExpanded ? <ChevronDown className="size-3"/> : <ChevronRight className="size-3"/>}
                                        </button>
                                    }

                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className={`text-xs font-semibold ${levelInfo.color}`}>
                                                {levelInfo.label}
                                            </span>
                                            {log.time &&
                                                <span className="text-xs text-zinc-500 font-mono">
                                                    {formatTime(log.time)}
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

                                        {isExpanded && log.data && log.level >= 30 &&
                                            <div className="mt-2 p-2 bg-zinc-900 rounded text-xs font-mono overflow-auto">
                                                <pre className="text-zinc-300 whitespace-pre-wrap break-words">
                                                    {JSON.stringify(
                                                        Object.fromEntries(
                                                            Object.entries(log.data).filter(
                                                                ([key]) => !["level", "time", "msg", "pid", "hostname"].includes(key)
                                                            )
                                                        ), null, 2
                                                    )}
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
