import {MediaType} from "@/lib/utils/enums";
import {ExtractStatsByType} from "@/lib/types/stats.types";
import {StatCard} from "@/lib/client/media-stats/StatCard";
import {RatingsChart} from "@/lib/client/media-stats/RatingsChart";
import {getMediaNaming} from "@/lib/client/media-stats/stats-utils";
import {ChartColumn, Clock, Heart, Play, Star, Tag} from "lucide-react";
import {TopAffinityCard} from "@/lib/client/media-stats/TopAffinityCard";
import {DistributionChart} from "@/lib/client/media-stats/DistributionChart";
import {StatusDistribution} from "@/lib/client/media-stats/StatusDistribution";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {capitalize, formatCurrency, formatHours, formatNumber} from "@/lib/utils/formating";
import {formatAvgRating} from "@/lib/utils/ratings";


interface MediaTypeDashboardProps {
    stats: ExtractStatsByType<MediaType>;
}


export function MediaTypeDashboard({ stats }: MediaTypeDashboardProps) {
    const { mediaType, ratingSystem, specificMediaStats } = stats;
    const ratingValue = formatAvgRating(ratingSystem, stats.avgRated);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4 max-sm:grid-cols-2">
                <StatCard
                    title="Total Entries"
                    value={formatNumber(stats.totalEntries)}
                    icon={<MainThemeIcon type={mediaType}/>}
                    subtitle={`${capitalize(mediaType)} in list`}
                />
                <StatCard
                    title={"Time Spent"}
                    icon={<Clock className="size-4"/>}
                    value={formatHours(stats.timeSpentHours)}
                    subtitle={`${stats.timeSpentHours.toFixed(1)} hours`}
                />
                {mediaType !== MediaType.GAMES &&
                    <StatCard
                        icon={<Play className="size-4"/>}
                        value={formatNumber(stats.totalSpecific)}
                        title={`${getMediaNaming(mediaType).totalSpecific}`}
                        subtitle={`Including ${formatNumber(stats.totalRedo)} ${getMediaNaming(mediaType).redo}`}
                    />
                }
                <StatCard
                    title="Avg. Rating"
                    value={ratingValue}
                    icon={<Star className="size-4"/>}
                    subtitle={`${formatNumber(stats.totalRated)} entries rated`}
                />
                <StatCard
                    title="Avg. Updates"
                    subtitle="Updates per month"
                    icon={<ChartColumn className="size-4"/>}
                    value={stats.avgUpdates?.toFixed(2) ?? "-"}
                />
                <MediaSpecificStats
                    stats={stats}
                />
                <StatCard
                    title="Total Favorites"
                    icon={<Heart className="size-4"/>}
                    value={formatNumber(stats.totalFavorites)}
                />
                <StatCard
                    title="Total Labels"
                    icon={<Tag className="size-4"/>}
                    value={formatNumber(specificMediaStats.totalLabels)}
                />
            </div>

            <StatusDistribution
                total={stats.totalEntries}
                statuses={stats.statusesCounts}
            />

            <div className="grid max-sm:grid-cols-1 grid-cols-2 gap-4">
                <DistributionChart
                    height={300}
                    enableBinning={true}
                    data={stats.specificMediaStats.durationDistrib}
                    title={getMediaNaming(mediaType).durationDistribution}
                    unit={getMediaNaming(mediaType).durationDistributionUnit}
                />
                <DistributionChart
                    height={300}
                    enableBinning={true}
                    title="Release Dates Distribution"
                    data={stats.specificMediaStats.releaseDates}
                />
                <RatingsChart
                    height={300}
                    mediaType={mediaType}
                    ratingSystem={ratingSystem}
                    ratings={specificMediaStats.ratings}
                />
                <DistributionChart
                    height={300}
                    title="Updates per Month"
                    data={stats.updatesDistribution}
                />
            </div>

            <MediaSpecificTopStats
                stats={stats}
            />
        </div>
    );
}


function MediaSpecificStats({ stats }: { stats: ExtractStatsByType<MediaType> }) {
    if (stats.mediaType === MediaType.SERIES || stats.mediaType === MediaType.ANIME) {
        return (
            <>
                <StatCard
                    title="Avg. Series Duration"
                    value={stats.specificMediaStats.avgDuration ?
                        `${(stats.specificMediaStats.avgDuration / 60).toFixed(1)} hours`
                        : "-"
                    }
                />
                <StatCard
                    title="Total Seasons"
                    value={formatNumber(stats.specificMediaStats.totalSeasons)}
                />
            </>
        );
    }

    if (stats.mediaType === MediaType.MOVIES) {
        return (
            <>
                <StatCard
                    title="Avg. Movie Duration"
                    value={stats.specificMediaStats.avgDuration ? `${stats.specificMediaStats.avgDuration.toFixed(0)} min` : "-"}
                />
                <StatCard
                    title="Total Budget"
                    value={formatCurrency(stats.specificMediaStats.totalBudget)}
                />
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats.specificMediaStats.totalRevenue)}
                />
            </>
        );
    }

    if (stats.mediaType === MediaType.GAMES) {
        return (
            <>
                <StatCard
                    title="Avg. Game Playtime"
                    subtitle="All games included"
                    value={stats.specificMediaStats.avgDuration ? `${stats.specificMediaStats.avgDuration.toFixed(0)} hours` : "-"}
                />
            </>
        );
    }

    if (stats.mediaType === MediaType.BOOKS) {
        return (
            <>
                <StatCard
                    title="Avg. Books Pages"
                    value={formatNumber(stats.specificMediaStats.avgDuration)}
                />
            </>
        );
    }

    if (stats.mediaType === MediaType.MANGA) {
        return (
            <>
                <StatCard
                    title="Avg. Manga Chapters"
                    value={formatNumber(stats.specificMediaStats.avgDuration)}
                />
            </>
        );
    }

    return null;
}


function MediaSpecificTopStats({ stats }: { stats: ExtractStatsByType<MediaType> }) {
    const { mediaType } = stats;

    if (mediaType === MediaType.SERIES || mediaType === MediaType.ANIME) {
        const { networksStats, actorsStats, countriesStats } = stats.specificMediaStats;

        return (
            <div className="grid max-sm:grid-cols-1 max-md:grid-cols-2 grid-cols-3 gap-4">
                <TopAffinityCard
                    job="platform"
                    title="Networks"
                    mediaType={mediaType}
                    topAffinity={networksStats}
                />
                <TopAffinityCard
                    job="actor"
                    title="Actors"
                    mediaType={mediaType}
                    topAffinity={actorsStats}
                />
                <TopAffinityCard
                    title="Countries"
                    topAffinity={countriesStats}
                />
            </div>
        );
    }

    if (mediaType === MediaType.MOVIES) {
        const { directorsStats, actorsStats, langsStats, genresStats } = stats.specificMediaStats;

        return (
            <div className="grid max-sm:grid-cols-1 max-md:grid-cols-2 grid-cols-4 gap-4">
                <TopAffinityCard
                    job="creator"
                    title="Directors"
                    mediaType={mediaType}
                    topAffinity={directorsStats}
                />
                <TopAffinityCard
                    job="actor"
                    title="Actors"
                    mediaType={mediaType}
                    topAffinity={actorsStats}
                />
                <TopAffinityCard
                    title="Genres"
                    topAffinity={genresStats}
                />
                <TopAffinityCard
                    title="Languages"
                    topAffinity={langsStats}
                />
            </div>
        );
    }

    if (mediaType === MediaType.GAMES) {
        const { developersStats, publishersStats, platformsStats, enginesStats, perspectivesStats } = stats.specificMediaStats;

        return (
            <div className="grid max-sm:grid-cols-1 max-md:grid-cols-2 grid-cols-3 gap-4">
                <TopAffinityCard
                    job="creator"
                    title="Developers"
                    mediaType={mediaType}
                    topAffinity={developersStats}
                />
                <TopAffinityCard
                    title="Platforms"
                    topAffinity={platformsStats}
                />
                <TopAffinityCard
                    title="Publishers"
                    topAffinity={publishersStats}
                />
                <TopAffinityCard
                    title="Engines"
                    topAffinity={enginesStats}
                />
                <TopAffinityCard
                    title="Perspectives"
                    topAffinity={perspectivesStats}
                />
            </div>
        );
    }

    if (mediaType === MediaType.BOOKS) {
        const { publishersStats, authorsStats, langsStats } = stats.specificMediaStats;

        return (
            <div className="grid max-sm:grid-cols-1 max-md:grid-cols-2 grid-cols-3 gap-4">
                <TopAffinityCard
                    job="creator"
                    title="Authors"
                    mediaType={mediaType}
                    topAffinity={authorsStats}
                />
                <TopAffinityCard
                    title="Publishers"
                    topAffinity={publishersStats}
                />
                <TopAffinityCard
                    title="Languages"
                    topAffinity={langsStats}
                />
            </div>
        );
    }

    if (mediaType === MediaType.MANGA) {
        const { publishersStats, authorsStats } = stats.specificMediaStats;

        return (
            <div className="grid max-sm:grid-cols-1 max-md:grid-cols-2 grid-cols-3 gap-4">
                <TopAffinityCard
                    job="creator"
                    title="Authors"
                    mediaType={mediaType}
                    topAffinity={authorsStats}
                />
                <TopAffinityCard
                    job="publisher"
                    title="Publishers"
                    mediaType={mediaType}
                    topAffinity={publishersStats}
                />
            </div>
        );
    }

    return null;
}
