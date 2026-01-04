import {cn} from "@/lib/utils/helpers";
import {useMemo, useState} from "react";
import {formatDateTime} from "@/lib/utils/formating";
import {Badge} from "@/lib/client/components/ui/badge";
import {Button} from "@/lib/client/components/ui/button";
import {TaskType} from "@/lib/types/query.options.types";
import {ChevronDown, ChevronRight, Database, Info, LucideIcon, TriangleAlert, XCircle} from "lucide-react";


export const LogViewer = ({ logsData }: { logsData: TaskType["logs"] }) => {
    const [expandedGroups, setExpandedGroups] = useState(() => new Set<string>());

    const groups = useMemo(() => {
        const result: {
            isGroup: boolean;
            logs: TaskType["logs"];
            groupKey?: string
        }[] = [];

        if (!logsData) return result;

        let i = 0;
        while (i < logsData.length) {
            const currentLog = logsData[i];
            const nextLog = logsData[i + 1];

            const getPrefix = (msg: string) => msg.split(":")[0];
            const currentPrefix = getPrefix(currentLog.msg);

            // Logic: Only group if logs have NO json data and match prefix
            // We don't want to hide logs that contain important metadata
            if (!currentLog.json && nextLog && !nextLog.json && getPrefix(nextLog.msg) === currentPrefix) {
                const group = [currentLog];
                let j = i + 1;
                while (j < logsData.length && !logsData[j].json && getPrefix(logsData[j].msg) === currentPrefix) {
                    group.push(logsData[j]);
                    j++;
                }

                if (group.length > 3) {
                    result.push({ isGroup: true, logs: group, groupKey: `${currentPrefix}-${i}` });
                    i = j;
                    continue;
                }
            }

            result.push({ isGroup: false, logs: [currentLog] });
            i++;
        }
        return result;
    }, [logsData]);

    const toggleGroup = (key: string) => {
        const newGroups = new Set(expandedGroups);
        if (newGroups.has(key)) newGroups.delete(key);
        else newGroups.add(key);
        setExpandedGroups(newGroups);
    };

    const getLevelInfo = (level: number) => {
        if (level >= 50) return { label: "ERROR", color: "text-red-400", icon: XCircle };
        if (level >= 40) return { label: "WARN", color: "text-yellow-400", icon: TriangleAlert };
        return { label: "INFO", color: "text-blue-400", icon: Info };
    };

    return (
        <div className="overflow-auto scrollbar-thin max-h-100 p-2 mt-4 border rounded-md bg-background/50">
            {groups.map((group, gIdx) => {
                if (group.isGroup && group.groupKey) {
                    const levelInfo = getLevelInfo(group.logs[0].level);
                    const isExpanded = expandedGroups.has(group.groupKey);
                    const displayLogs = isExpanded ? group.logs : group.logs.slice(0, 1);

                    return (
                        <div key={group.groupKey} className="border-b last:border-b-0 border-dashed bg-muted/20">
                            {displayLogs.map((log, lIdx) =>
                                <LogRow
                                    log={log}
                                    key={lIdx}
                                    levelInfo={levelInfo}
                                    hideBorder={!isExpanded || lIdx !== displayLogs.length - 1}
                                />
                            )}
                            <div className="px-8 pb-2">
                                <Button size="xs" onClick={() => toggleGroup(group.groupKey!)}>
                                    {isExpanded ? "Show less" : `Show ${group.logs.length - 1} more similar...`}
                                </Button>
                            </div>
                        </div>
                    );
                }

                return (
                    <LogRow
                        key={gIdx}
                        log={group.logs[0]}
                        levelInfo={getLevelInfo(group.logs[0].level)}
                    />
                );
            })}
        </div>
    );
};


interface LogRowProps {
    hideBorder?: boolean;
    log: TaskType["logs"][number];
    levelInfo: { label: string, color: string, icon: LucideIcon };
}


function LogRow({ log, levelInfo, hideBorder }: LogRowProps) {
    const [isJsonOpen, setIsJsonOpen] = useState(false);

    const Icon = levelInfo.icon;
    const hasJson = log.json && Object.keys(log.json).length > 0;

    return (
        <div className={cn(
            "flex flex-col transition-colors",
            !hideBorder && "border-b last:border-b-0",
            hasJson ? "hover:bg-accent/40 cursor-pointer" : "hover:bg-accent/20"
        )}>
            <div className="px-3 py-1.5 flex items-start gap-2" onClick={() => hasJson && setIsJsonOpen(!isJsonOpen)}>
                <Icon className={cn("size-3.5 mt-1 shrink-0", levelInfo.color)}/>

                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap text-xs">
                        <span className={cn("font-bold uppercase", levelInfo.color)}>
                            {levelInfo.label}
                        </span>
                        {log.time && (
                            <span className="text-muted-foreground font-mono">
                                {formatDateTime(log.time, { seconds: true })}
                            </span>
                        )}
                        <span className="text-sm break-all">
                            {log.msg}
                        </span>
                        {hasJson &&
                            <Badge>
                                <Database/> JSON
                            </Badge>
                        }
                    </div>
                </div>

                {hasJson &&
                    <div className="shrink-0 text-muted-foreground">
                        {isJsonOpen ? <ChevronDown className="size-4"/> : <ChevronRight className="size-4"/>}
                    </div>
                }
            </div>

            {(isJsonOpen && hasJson) &&
                <div className="px-9 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="p-3 bg-black/90 text-green-400 rounded-md border border-border text-xs font-mono
                        overflow-auto scrollbar-thin max-h-64 shadow-inner">
                        <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.json, null, 2)}
                        </pre>
                    </div>
                </div>
            }
        </div>
    );
}
