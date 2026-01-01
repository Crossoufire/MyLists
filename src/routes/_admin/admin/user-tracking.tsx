import React, {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {capitalize} from "@/lib/utils/formating";
import {Input} from "@/lib/client/components/ui/input";
import {Label} from "@/lib/client/components/ui/label";
import {createFileRoute} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {getThemeColor} from "@/lib/utils/colors-and-icons";
import {useDebounce} from "@/lib/client/hooks/use-debounce";
import {ProviderSearchResult} from "@/lib/types/provider.types";
import {ApiProviderType, MediaType, Status} from "@/lib/utils/enums";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {Tabs, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {MainThemeIcon} from "@/lib/client/components/general/MainThemeIcons";
import {navSearchOptions} from "@/lib/client/react-query/query-options/query-options";
import {adminUserTracking} from "@/lib/client/react-query/query-options/admin-options";
import {Card, CardAction, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {ArrowDown, ArrowUp, BarChart3, Clock, Heart, Loader2, type LucideIcon, MessageSquare, Percent, Search, Star, TrendingUp, X} from "lucide-react";


type Granularity = "day" | "week" | "month";
type TimeRange = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";


export const Route = createFileRoute("/_admin/admin/user-tracking")({
    component: UserTrackingPage,
});


function UserTrackingPage() {
    const [selectedUser, setSelectedUser] = useState<ProviderSearchResult | null>(null);

    return (
        <DashboardShell>
            <DashboardHeader
                heading="Media Progress Timeline"
                description="Track user journeys across all media types with detailed insights"
            />

            <div className="space-y-6">
                {!selectedUser ?
                    <UserSearch
                        onSelectUser={setSelectedUser}
                    />
                    :
                    <>
                        <SelectedUserBanner
                            user={selectedUser}
                            onReset={() => setSelectedUser(null)}
                        />
                        <UserTrackingContent
                            userId={selectedUser.id as number}
                        />
                    </>
                }
            </div>
        </DashboardShell>
    );
}


function UserSearch({ onSelectUser }: { onSelectUser: (user: ProviderSearchResult) => void }) {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const debouncedSearch = useDebounce(search, 350);
    const { data: users = { data: [] }, isLoading } = useQuery(navSearchOptions(debouncedSearch, 1, ApiProviderType.USERS));

    const handleSelect = (user: ProviderSearchResult) => {
        setSearch("");
        setIsOpen(false);
        onSelectUser(user);
    };

    return (
        <div className="relative max-w-sm">
            <Label className="mb-2">
                Search user
            </Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                <Input
                    value={search}
                    className="pl-9"
                    placeholder="Search by username..."
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    onChange={(ev) => {
                        setIsOpen(true);
                        setSearch(ev.target.value);
                    }}
                />
                {isLoading &&
                    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"/>
                }
            </div>

            {isOpen && debouncedSearch && users.data.length > 0 &&
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
                    {users.data.map((user) =>
                        <button
                            key={user.id}
                            onMouseDown={() => handleSelect(user)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                        >
                            <ProfileIcon
                                className="size-8"
                                fallbackSize="text-md"
                                user={{ name: user.name, image: user.image }}
                            />
                            <span>{user.name}</span>
                        </button>
                    )}
                </div>
            }

            {isOpen && debouncedSearch && !isLoading && users.data.length === 0 &&
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-3 text-center text-sm text-muted-foreground shadow-lg">
                    No users found
                </div>
            }
        </div>
    );
}


function SelectedUserBanner({ user, onReset }: { user: ProviderSearchResult; onReset: () => void }) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-card p-4 max-w-md">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full">
                    <ProfileIcon
                        className="size-10"
                        fallbackSize="text-lg"
                        user={{ name: user.name, image: user.image }}
                    />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">
                        Viewing data for
                    </p>
                    <p className="font-semibold">
                        {user.name}
                    </p>
                </div>
            </div>
            <Button variant="outline" size="sm" onClick={onReset}>
                <X/> Change User
            </Button>
        </div>
    );
}


function UserTrackingContent({ userId }: { userId: number }) {
    const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
    const { data: rawData = [], isLoading } = useQuery(adminUserTracking(userId));
    const [granularity, setGranularity] = useState<Granularity>("month");
    const [selectedMediaType, setSelectedMediaType] = useState<MediaType>(MediaType.SERIES);

    const color = getThemeColor(selectedMediaType);

    const processedData = useMemo(() => {
        const byType = rawData
            .filter((item) => item.mediaType === selectedMediaType)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (byType.length === 0) return [];

        // Calculate deltas between consecutive snapshots
        const deltas: Array<{
            timestamp: string;
            redoDelta: number;
            timeDelta: number;
            ratedDelta: number;
            entriesDelta: number;
            specificDelta: number;
            commentsDelta: number;
            favoritesDelta: number;
            currentEntries: number;
            currentRating: number | null;
            statusChanges: Partial<Record<Status, number>>;
        }> = [];

        for (let i = 1; i < byType.length; i++) {
            const curr = byType[i];
            const prev = byType[i - 1];

            // Calculate status count changes
            const statusChanges: Partial<Record<Status, number>> = {};
            const allStatuses = new Set([
                ...Object.keys(prev.statusCounts || {}),
                ...Object.keys(curr.statusCounts || {}),
            ]) as Set<Status>;

            for (const status of allStatuses) {
                const prevCount = prev.statusCounts?.[status] ?? 0;
                const currCount = curr.statusCounts?.[status] ?? 0;
                const delta = currCount - prevCount;
                if (delta !== 0) {
                    statusChanges[status] = delta;
                }
            }

            deltas.push({
                statusChanges,
                timestamp: curr.timestamp,
                currentRating: curr.averageRating,
                currentEntries: curr.totalEntries,
                redoDelta: curr.totalRedo - prev.totalRedo,
                ratedDelta: curr.entriesRated - prev.entriesRated,
                entriesDelta: curr.totalEntries - prev.totalEntries,
                specificDelta: curr.totalSpecific - prev.totalSpecific,
                commentsDelta: curr.entriesCommented - prev.entriesCommented,
                favoritesDelta: curr.entriesFavorites - prev.entriesFavorites,
                timeDelta: Math.max(0, curr.timeSpent - prev.timeSpent),
            });
        }

        return deltas;
    }, [rawData, selectedMediaType]);

    const filteredData = useMemo(() => {
        if (timeRange === "ALL") return processedData;

        const now = new Date();
        const cutoffDate = new Date();

        switch (timeRange) {
            case "1W":
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case "1M":
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
            case "3M":
                cutoffDate.setMonth(now.getMonth() - 3);
                break;
            case "6M":
                cutoffDate.setMonth(now.getMonth() - 6);
                break;
            case "1Y":
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        return processedData.filter((item) => new Date(item.timestamp) >= cutoffDate);
    }, [processedData, timeRange]);

    const chartData = useMemo(() => {
        const grouped: Record<
            string,
            {
                sortKey: number;
                entries: number;
                specific: number;
                timeSpent: number;
                rated: number;
                comments: number;
                favorites: number;
                ratings: number[];
            }
        > = {};

        filteredData.forEach((item) => {
            const date = new Date(item.timestamp);
            let key: string;
            let sortKey: number;

            switch (granularity) {
                case "day":
                    sortKey = date.getTime();
                    key = date.toLocaleDateString("fr", { day: "2-digit", month: "short" });
                    break;
                case "week": {
                    const startOfYear = new Date(date.getFullYear(), 0, 1);
                    const weekNum = Math.ceil(
                        ((date.getTime() - startOfYear.getTime()) / 86400000 +
                            startOfYear.getDay() +
                            1) /
                        7
                    );
                    key = `W${weekNum} '${date.getFullYear().toString().slice(-2)}`;
                    sortKey = date.getFullYear() * 100 + weekNum;
                    break;
                }
                case "month":
                default:
                    sortKey = date.getFullYear() * 100 + date.getMonth();
                    key = date.toLocaleDateString("fr", { month: "short", year: "2-digit" });
            }

            if (!grouped[key]) {
                grouped[key] = {
                    sortKey,
                    entries: 0,
                    specific: 0,
                    timeSpent: 0,
                    rated: 0,
                    comments: 0,
                    favorites: 0,
                    ratings: [],
                };
            }

            // Sum the deltas
            grouped[key].entries += item.entriesDelta;
            grouped[key].specific += item.specificDelta;
            grouped[key].timeSpent += item.timeDelta;
            grouped[key].rated += item.ratedDelta;
            grouped[key].comments += item.commentsDelta;
            grouped[key].favorites += item.favoritesDelta;

            if (item.currentRating !== null) {
                grouped[key].ratings.push(item.currentRating);
            }
        });

        return Object.entries(grouped)
            .sort(([, a], [, b]) => a.sortKey - b.sortKey)
            .map(([period, data]) => ({
                period,
                entries: data.entries,
                specific: data.specific,
                rated: data.rated,
                comments: data.comments,
                favorites: data.favorites,
                timeSpent: Math.round(data.timeSpent / 60),
                avgRating:
                    data.ratings.length > 0
                        ? Number(
                            (
                                data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
                            ).toFixed(2)
                        )
                        : 0,
            }));
    }, [filteredData, granularity]);

    const trends = useMemo(() => {
        if (chartData.length < 2) {
            return { entries: 0, specific: 0, time: 0, rated: 0 };
        }

        const last = chartData[chartData.length - 1];
        const prev = chartData[chartData.length - 2];

        const calcTrend = (current: number, previous: number) => {
            if (previous === 0) {
                return current > 0 ? 100 : 0;
            }
            return Number((((current - previous) / previous) * 100).toFixed(1));
        };

        return {
            entries: calcTrend(last.entries, prev.entries),
            specific: calcTrend(last.specific, prev.specific),
            time: calcTrend(last.timeSpent, prev.timeSpent),
            rated: calcTrend(last.rated, prev.rated),
        };
    }, [chartData]);

    const totalStats = useMemo(() => {
        const byType = rawData
            .filter((item) => item.mediaType === selectedMediaType)
            .sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

        const latestSnapshot = byType[0];

        const activityTotals = filteredData.reduce(
            (acc, item) => ({
                entriesAdded: acc.entriesAdded + item.entriesDelta,
                specificAdded: acc.specificAdded + item.specificDelta,
                timeSpent: acc.timeSpent + item.timeDelta,
                ratedAdded: acc.ratedAdded + item.ratedDelta,
                commentsAdded: acc.commentsAdded + item.commentsDelta,
                favoritesAdded: acc.favoritesAdded + item.favoritesDelta,
            }),
            {
                entriesAdded: 0,
                specificAdded: 0,
                timeSpent: 0,
                ratedAdded: 0,
                commentsAdded: 0,
                favoritesAdded: 0,
            }
        );

        return {
            // Current totals from latest snapshot
            totalEntries: latestSnapshot?.totalEntries ?? 0,
            totalSpecific: latestSnapshot?.totalSpecific ?? 0,
            totalRated: latestSnapshot?.entriesRated ?? 0,
            totalComments: latestSnapshot?.entriesCommented ?? 0,
            totalFavorites: latestSnapshot?.entriesFavorites ?? 0,
            totalTimeSpent: latestSnapshot?.timeSpent ?? 0,
            avgRating: latestSnapshot?.averageRating?.toFixed(1) ?? "0",
            statusCounts: latestSnapshot?.statusCounts ?? {},

            // Activity in the selected period (deltas)
            ...activityTotals,

            completionRate:
                latestSnapshot && latestSnapshot.totalEntries > 0
                    ? ((latestSnapshot.entriesRated / latestSnapshot.totalEntries) * 100).toFixed(1)
                    : "0",
        };
    }, [rawData, filteredData, selectedMediaType]);

    function getSpecificLabel(mediaType: MediaType) {
        switch (mediaType) {
            case MediaType.SERIES:
            case MediaType.ANIME:
                return "Episodes";
            case MediaType.MOVIES:
                return "Movies";
            case MediaType.GAMES:
                return "Hours Played";
            case MediaType.BOOKS:
            case MediaType.MANGA:
                return "Pages";
            default:
                return "Items";
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground"/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-row justify-between gap-4 max-sm:flex-col max-sm:items-center">
                <Tabs value={selectedMediaType} onValueChange={(v) => setSelectedMediaType(v as MediaType)}>
                    <TabsList className="flex gap-6">
                        {Object.values(MediaType).map((mediaType) =>
                            <TabsTrigger key={mediaType} value={mediaType}>
                                <MainThemeIcon type={mediaType}/>
                                <span className="hidden sm:inline">
                                    {capitalize(mediaType)}
                                </span>
                            </TabsTrigger>
                        )}
                    </TabsList>
                </Tabs>
                <div className="flex gap-4">
                    <div className="flex gap-1 rounded-md border p-1">
                        {(["day", "week", "month"] as Granularity[]).map((g) =>
                            <Button
                                key={g}
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setGranularity(g)}
                                variant={granularity === g ? "default" : "ghost"}
                            >
                                {capitalize(g)}
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-1 rounded-md border p-1">
                        {(["1W", "1M", "3M", "6M", "1Y", "ALL"] as TimeRange[]).map((range) =>
                            <Button
                                size="sm"
                                key={range}
                                className="h-7 px-2 text-xs"
                                onClick={() => setTimeRange(range)}
                                variant={timeRange === range ? "default" : "ghost"}
                            >
                                {range}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-3 max-sm:grid-cols-2">
                <StatCard
                    unit="h"
                    icon={Clock}
                    color={color}
                    label="Hours Spent"
                    trend={trends.time}
                    total={Math.round(totalStats.totalTimeSpent / 60)}
                    periodDelta={Math.round(totalStats.timeSpent / 60)}
                />
                <StatCard
                    color={color}
                    icon={BarChart3}
                    label="Total Entries"
                    trend={trends.entries}
                    total={totalStats.totalEntries}
                    periodDelta={totalStats.entriesAdded}
                />
                <StatCard
                    color={color}
                    icon={TrendingUp}
                    trend={trends.specific}
                    total={totalStats.totalSpecific}
                    periodDelta={totalStats.specificAdded}
                    label={getSpecificLabel(selectedMediaType)}
                />
                <StatCard
                    icon={Star}
                    color={color}
                    label="# Rated"
                    trend={trends.rated}
                    total={totalStats.totalRated}
                    periodDelta={totalStats.ratedAdded}
                />
                <StatCard
                    color={color}
                    icon={TrendingUp}
                    label="Avg. Rating"
                    total={totalStats.avgRating}
                />
                <StatCard
                    unit="%"
                    color={color}
                    icon={Percent}
                    label="Completion"
                    total={totalStats.completionRate}
                />
                <StatCard
                    color={color}
                    label="Comments"
                    icon={MessageSquare}
                    total={totalStats.totalComments}
                    periodDelta={totalStats.commentsAdded}
                />
            </div>
            <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="mb-2 flex items-center gap-2">
                            <BarChart3 className="size-5" style={{ color }}/>
                            Entries Over Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300} className="-ml-8">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted"/>
                                <XAxis
                                    dataKey="period"
                                    className="text-xs"
                                    tick={{ fill: "currentColor" }}
                                />
                                <YAxis className="text-xs" tick={{ fill: "currentColor" }}/>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        backgroundColor: "var(--popover)",
                                        border: "1px solid var(--border)",
                                    }}
                                />
                                <Area
                                    stroke={color}
                                    name="Entries"
                                    type="monotone"
                                    strokeWidth={2}
                                    dataKey="entries"
                                    fill="url(#colorEntries)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="mb-2 flex items-center gap-2">
                            <Star className="size-5" style={{ color }}/>
                            Average Rating Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300} className="-ml-8">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted"/>
                                <XAxis
                                    dataKey="period"
                                    className="text-xs"
                                    tick={{ fill: "currentColor" }}
                                />
                                <YAxis
                                    domain={[0, 5]}
                                    className="text-xs"
                                    tick={{ fill: "currentColor" }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        backgroundColor: "var(--popover)",
                                        border: "1px solid var(--border)",
                                    }}
                                />
                                <Line
                                    stroke={color}
                                    type="monotone"
                                    strokeWidth={3}
                                    name="Avg Rating"
                                    dataKey="avgRating"
                                    activeDot={{ r: 6 }}
                                    dot={{ fill: color, r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="mb-2 flex items-center gap-2">
                            <Clock className="size-5" style={{ color }}/>
                            Time Investment (Hours)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300} className="-ml-8">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted"/>
                                <XAxis
                                    dataKey="period"
                                    className="text-xs"
                                    tick={{ fill: "currentColor" }}
                                />
                                <YAxis className="text-xs" tick={{ fill: "currentColor" }}/>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        backgroundColor: "var(--popover)",
                                        border: "1px solid var(--border)",
                                    }}
                                />
                                <Bar
                                    dataKey="timeSpent"
                                    fill={color}
                                    radius={[4, 4, 0, 0]}
                                    name="Hours"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="mb-2 flex items-center gap-2">
                            <Heart className="size-5" style={{ color }}/>
                            Engagement Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300} className="-ml-8">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted"/>
                                <XAxis
                                    dataKey="period"
                                    className="text-xs"
                                    tick={{ fill: "currentColor" }}
                                />
                                <YAxis className="text-xs" tick={{ fill: "currentColor" }}/>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        backgroundColor: "var(--popover)",
                                        border: "1px solid var(--border)",
                                    }}
                                />
                                <Bar dataKey="favorites" fill={color} radius={[4, 4, 0, 0]} name="Favorites"/>
                                <Bar fill={color} opacity={0.4} name="Comments" dataKey="comments" radius={[4, 4, 0, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


interface StatCardProps {
    label: string;
    color: string;
    unit?: string;
    trend?: number;
    icon: LucideIcon;
    total: number | string;
    periodDelta?: number | string;
}


function StatCard({ icon: Icon, label, total, periodDelta, color, trend, unit = "" }: StatCardProps) {
    const showDelta = periodDelta !== undefined && periodDelta !== 0;
    const deltaValue = typeof periodDelta === "number" ? periodDelta : parseFloat(periodDelta || "0");
    const isPositiveDelta = deltaValue > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                    {label}
                </CardTitle>
                <CardAction className="mt-1">
                    <Icon className="size-4" style={{ color }}/>
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                        {total}
                        {unit}
                    </span>
                        {trend !== undefined && trend !== 0 &&
                            <span className={`flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
                                {trend > 0 ? <ArrowUp className="size-3"/> : <ArrowDown className="size-3"/>}
                                {Math.abs(trend)}%
                            </span>
                        }
                    </div>
                    {showDelta &&
                        <span className={`text-xs font-medium ${isPositiveDelta ? "text-green-500" : "text-red-500"}`}>
                        {isPositiveDelta ? "+" : ""}
                            {periodDelta}
                            {unit} this period
                    </span>
                    }
                </div>
            </CardContent>
        </Card>
    );
}
