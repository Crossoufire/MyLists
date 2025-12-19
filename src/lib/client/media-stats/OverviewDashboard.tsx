import {ExtractStatsByType} from "@/lib/types/stats.types";
import {StatCard} from "@/lib/client/media-stats/StatCard";
import {DistributionChart} from "@/lib/client/media-stats/DistributionChart";
import {ChartColumn, Clock, Heart, MessageSquare, RefreshCw, Star, Tag, TrendingUp, Trophy, User} from "lucide-react";
import {formatAvgRating, formatDuration, formatNumber, formatPercent} from "@/lib/client/media-stats/stats-utils";


interface OverviewDashboardProps {
    stats: ExtractStatsByType<undefined>;
}


export function OverviewDashboard({ stats }: OverviewDashboardProps) {
    const { ratingSystem, avgRated } = stats;
    const ratingValue = formatAvgRating(ratingSystem, avgRated);

    return (
        <div className="space-y-6">
            <div className="grid max-sm:grid-cols-2 grid-cols-5 gap-4">
                {stats.totalUsers &&
                    <StatCard
                        title="Total Users"
                        subtitle="Accounts Activated"
                        icon={<User className="size-4"/>}
                        value={formatNumber(stats.totalUsers)}
                    />
                }
                <StatCard
                    title="Total Entries"
                    icon={<TrendingUp className="size-4"/>}
                    value={formatNumber(stats.totalEntries)}
                    subtitle={`${formatNumber(stats.totalEntriesNoPlan)} excluding planned`}
                />
                <StatCard
                    title="Total Time"
                    icon={<Clock className="size-4"/>}
                    value={formatDuration(stats.totalHours)}
                    subtitle={`${formatNumber(Math.round(stats.totalHours))} hours`}
                />
                <StatCard
                    title="Avg. Rating"
                    value={ratingValue}
                    icon={<Star className="size-4"/>}
                    subtitle={`${formatNumber(stats.totalRated)} (${formatPercent(stats.percentRated)}) entries rated`}
                />
                <StatCard
                    title="Platinum Achievements"
                    subtitle="All media type included"
                    icon={<Trophy className="size-4"/>}
                    value={formatNumber(stats.platinumAchievements)}
                />
                <StatCard
                    title="Total Re-experiences"
                    subtitle="Re-watches / re-reads"
                    value={formatNumber(stats.totalRedo)}
                    icon={<RefreshCw className="size-4"/>}
                />
                <StatCard
                    title="Total Favorites"
                    icon={<Heart className="size-4"/>}
                    value={formatNumber(stats.totalFavorites)}
                    subtitle={`Avg: ${stats.avgFavorites?.toFixed(2) ?? "-"}`}
                />
                <StatCard
                    title="Total Comments"
                    value={formatNumber(stats.totalComments)}
                    icon={<MessageSquare className="size-4"/>}
                    subtitle={`Avg: ${stats.avgComments?.toFixed(2) ?? "-"}`}
                />
                <StatCard
                    title="Total Updates"
                    icon={<ChartColumn className="size-4"/>}
                    value={formatNumber(stats.updatesPerMonth.totalUpdates)}
                    subtitle={`Avg: ${stats.updatesPerMonth.avgUpdates?.toFixed(2) ?? "-"}`}
                />
                <StatCard
                    title="Total Labels"
                    icon={<Tag className="size-4"/>}
                    subtitle="All media type included"
                    value={formatNumber(stats.totalLabels)}
                />
            </div>

            <div className="grid max-sm:grid-cols-1 grid-cols-2 gap-4">
                <DistributionChart
                    height={350}
                    data={stats.mediaTimeDistribution}
                    title="Time (hours) Distribution by Media"
                />
                <DistributionChart
                    height={350}
                    title="Updates per Month"
                    data={stats.updatesPerMonth.updatesDistribution}
                />
            </div>
        </div>
    );
}
