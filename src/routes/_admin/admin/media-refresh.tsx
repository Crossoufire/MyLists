import {MediaType} from "@/lib/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {BarChart3, Flame, RefreshCw, Users} from "lucide-react";
import {UserStats} from "@/lib/client/components/admin/UserStats";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {formatDateTime, formatNumber, formatRelativeTime} from "@/lib/utils/formating";
import {Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {adminMediaRefreshOptions} from "@/lib/client/react-query/query-options/admin-options";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/client/components/ui/table";


export const Route = createFileRoute("/_admin/admin/media-refresh")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(adminMediaRefreshOptions()),
    component: MediaRefreshPage,
});


const chartColors: Record<MediaType, string> = {
    series: "var(--color-series)",
    anime: "var(--color-anime)",
    movies: "var--color-movies)",
    games: "var(--color-games)",
    books: "var(--color-books)",
    manga: "var(--color-manga)",
};


function MediaRefreshPage() {
    const apiData = useSuspenseQuery(adminMediaRefreshOptions()).data;
    const { summary, days } = apiData;
    const total = summary.total || 0;

    const totalsByRoleMap = new Map(apiData.totalsByRole.map((row) => [row.role, Number(row.count)]));
    const totalsByTypeMap = new Map(apiData.totalsByType.map((row) => [row.mediaType, Number(row.count)]));

    const mediaTypeRows = Object.values(MediaType).map((mediaType) => ({
        mediaType,
        count: totalsByTypeMap.get(mediaType) ?? 0,
    })).sort((a, b) => b.count - a.count);

    const roleRows = Array.from(totalsByRoleMap.entries())
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count);

    const formatDay = (value: string) => {
        if (!value) return "-";
        const date = new Date(`${value}T00:00:00Z`);
        if (isNaN(date.getTime())) return value;
        return date.toLocaleDateString("en", { month: "short", day: "numeric" });
    };

    return (
        <DashboardShell>
            <DashboardHeader heading="Refresh Monitoring" description="Track metadata refresh activity and spot power users."/>
            <div className="space-y-6">
                <div className="grid gap-4 grid-cols-4 max-sm:grid-cols-2">
                    <UserStats
                        icon={RefreshCw}
                        title="Total Refreshes"
                        value={formatNumber(total)}
                        description={`Last ${days} days`}
                    />
                    <UserStats
                        icon={Users}
                        title="Unique Users"
                        description="Triggered refreshes"
                        value={formatNumber(summary.uniqueUsers)}
                    />
                    <UserStats
                        icon={BarChart3}
                        title="Avg / Day"
                        description="Rolling average"
                        value={formatNumber(summary.avgPerDay)}
                    />
                    <UserStats
                        icon={Flame}
                        title="Busiest Day"
                        description="Highest daily volume"
                        value={summary.busiestDay ? `${formatDay(summary.busiestDay)} (${summary.busiestCount})` : "-"}
                    />
                </div>

                <div className="grid gap-4 grid-cols-7 max-sm:grid-cols-2">
                    <Card className="col-span-4 max-sm:col-span-5">
                        <CardHeader>
                            <CardTitle>Daily Refreshes</CardTitle>
                            <CardDescription>
                                Stacked by media type (last {days} days)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-2">
                            <ResponsiveContainer width="100%" height={340} className="-ml-4">
                                <BarChart data={apiData.daily}>
                                    <XAxis
                                        fontSize={12}
                                        dataKey="date"
                                        stroke="#888888"
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => value.slice(5)}
                                    />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                    <Tooltip
                                        labelFormatter={(label) => `Day: ${label}`}
                                        formatter={(value) => formatNumber(Number(value))}
                                        contentStyle={{
                                            borderRadius: "8px",
                                            backgroundColor: "var(--popover)",
                                            border: "1px solid var(--border)",
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: "12px" }}/>
                                    {Object.values(MediaType).map((mediaType) =>
                                        <Bar
                                            key={mediaType}
                                            dataKey={mediaType}
                                            stackId="refreshes"
                                            radius={[3, 3, 0, 0]}
                                            fill={chartColors[mediaType]}
                                        />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 max-sm:col-span-5">
                        <CardHeader>
                            <CardTitle>Media Type Mix</CardTitle>
                            <CardDescription>Share of refreshes by media type</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-2">
                            <div className="space-y-3">
                                {mediaTypeRows.map((row) => {
                                    const percentage = total ? Math.round((row.count / total) * 100) : 0;
                                    return (
                                        <div key={row.mediaType} className="space-y-1 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium capitalize">{row.mediaType}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatNumber(row.count)} ({percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full"
                                                    style={{ width: `${percentage}%`, backgroundColor: chartColors[row.mediaType] }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 grid-cols-7 max-sm:grid-cols-2">
                    <Card className="col-span-3 max-sm:col-span-5">
                        <CardHeader>
                            <CardTitle>Role Breakdown</CardTitle>
                            <CardDescription>Refresh volume by role</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Refreshes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roleRows.length === 0 &&
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                No data yet
                                            </TableCell>
                                        </TableRow>
                                    }
                                    {roleRows.map((row) =>
                                        <TableRow key={row.role}>
                                            <TableCell className="capitalize">{row.role}</TableCell>
                                            <TableCell className="text-right">{formatNumber(row.count)}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="col-span-4 max-sm:col-span-5">
                        <CardHeader>
                            <CardTitle>Top Refreshers</CardTitle>
                            <CardDescription>
                                Most active users in the last {days} days
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Refreshes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apiData.topUsers.length === 0 &&
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                No refresh activity yet
                                            </TableCell>
                                        </TableRow>
                                    }
                                    {apiData.topUsers.map((user) => (
                                        <TableRow key={user.userId}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell className="capitalize">{user.role}</TableCell>
                                            <TableCell className="text-right">{formatNumber(user.count)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Refreshes</CardTitle>
                        <CardDescription>Latest metadata refresh activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>When</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Media Type</TableHead>
                                    <TableHead className="text-right">API ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {apiData.recentRefreshes.length === 0 &&
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No refresh activity yet
                                        </TableCell>
                                    </TableRow>
                                }
                                {apiData.recentRefreshes.map((row, idx) => (
                                    <TableRow key={`${row.userId}-${row.apiId}-${idx}`}>
                                        <TableCell className="text-muted-foreground">
                                            <span title={formatDateTime(row.refreshedAt)}>
                                                {formatRelativeTime(row.refreshedAt)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium">{row.name}</TableCell>
                                        <TableCell className="capitalize">{row.role}</TableCell>
                                        <TableCell className="capitalize">{row.mediaType}</TableCell>
                                        <TableCell className="text-right">{row.apiId}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    );
}
