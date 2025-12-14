import {MediaType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/functions";
import {MEDIA_CONFIGS} from "@/lib/client/social-card/media.config";
import {UserStats, UserStatsCard} from "@/lib/types/query.options.types";
import {COMPONENT_DEFS} from "@/lib/client/social-card/components-registry";
import {TopItemStat} from "@/lib/client/components/social-card/TopItemStat";
import {YearInReviewStat} from "@/lib/client/components/social-card/YearReviewStat";
import {SingleValueStat} from "@/lib/client/components/social-card/SingleValueStat";
import {FeaturedMediaStat} from "@/lib/client/components/social-card/FeaturedMediaStat";
import {MediaShowcaseStat} from "@/lib/client/components/social-card/MediaShowcaseStat";
import {ActiveComponent, CompId, ComponentDataMap, Timeframe} from "@/lib/client/social-card/types";


interface StatBlockProps {
    isLoading: boolean;
    mediaType: MediaType;
    timeframe: Timeframe;
    component: ActiveComponent;
    stats: UserStatsCard | undefined;
    onEdit: (slotIndex?: number) => void;
}


function getComponentData<T extends CompId>(compId: T, component: ActiveComponent, stats: UserStatsCard | undefined): ComponentDataMap[T] | undefined {
    const compDef = COMPONENT_DEFS[compId];

    // Manual components use their own data
    if (compDef.mode === "manual") {
        return component.manualData as ComponentDataMap[T];
    }

    // Auto components get data from stats
    if (!stats) return undefined;

    // Map component ID to stats key
    return stats[compId as keyof typeof stats] as ComponentDataMap[T];
}


export function StatBlock({ component, mediaType, timeframe, stats, isLoading, onEdit }: StatBlockProps) {
    const { compId } = component;
    const compDef = COMPONENT_DEFS[compId];
    const mediaConfig = MEDIA_CONFIGS[mediaType];

    const topItemStats: CompId[] = [
        "topGenre",
        "topActor",
        "topAuthor",
        "topDirector",
        "topPlatform",
        "topDeveloper",
    ];

    const singleValueStats: CompId[] = [
        "activity",
        "comments",
        "avgRating",
        "timeSpent",
        "pagesRead",
        "favorites",
        "mediaCount",
        "chaptersRead",
        "episodesWatched",
    ];

    const data = getComponentData(compId, component, stats);

    if (singleValueStats.includes(compId)) {
        const singleData = data as { value: number | string } | undefined;

        // Determine labels based on component type
        const labelMap: Partial<Record<CompId, { label: string; subLabel?: string }>> = {
            activity: {
                label: "Activity",
                subLabel: `${capitalize(mediaConfig.terminology.plural)} updates`,
            },
            comments: {
                label: "Comments",
                subLabel: "Written",
            },
            avgRating: {
                label: `Avg. ${mediaConfig.terminology.ratingLabel}`,
            },
            timeSpent: {
                label: mediaConfig.terminology.timeLabel,
                subLabel: `${capitalize(mediaConfig.terminology.timeUnit)} spent`,
            },
            favorites: {
                label: "Favorites",
                subLabel: `${capitalize(mediaConfig.terminology.plural)} favorited`,
            },
            pagesRead: {
                label: "Pages",
                subLabel: "Read",
            },
            mediaCount: {
                label: `${capitalize(mediaConfig.terminology.plural)} ${capitalize(mediaConfig.terminology.verbPast)}`,
            },
            chaptersRead: {
                label: "Chapters",
                subLabel: "Read",
            },
            episodesWatched: {
                label: "Episodes",
                subLabel: "Watched",
            },
        };

        const { label, subLabel } = labelMap[compId] ?? { label: compDef.name };

        return (
            <SingleValueStat
                label={label}
                icon={compDef.icon}
                subLabel={subLabel}
                isLoading={isLoading}
                timeframe={timeframe}
                layout={component.layout}
                value={singleData?.value}
                mediaConfig={mediaConfig}
            />
        );
    }

    if (topItemStats.includes(compId)) {
        const topData = data as { name: string; count: number } | undefined;

        const labelMap: Partial<Record<CompId, string>> = {
            topGenre: "Top Genre",
            topActor: "Top Actor",
            topAuthor: "Top Author",
            topDirector: "Top Director",
            topPlatform: "Top Platform",
            topDeveloper: "Top Developer",
        };

        return (
            <TopItemStat
                data={topData}
                icon={compDef.icon}
                timeframe={timeframe}
                mediaConfig={mediaConfig}
                layout={component.layout}
                label={labelMap[compId] ?? compDef.name}
            />
        );
    }

    // Year in Review
    if (compId === "yearInReview") {
        return (
            <YearInReviewStat
                isLoading={isLoading}
                mediaConfig={mediaConfig}
                data={data as ComponentDataMap["yearInReview"] | undefined}
            />
        );
    }

    // Featured Media
    if (compId === "featuredMedia") {
        return (
            <FeaturedMediaStat
                mediaConfig={mediaConfig}
                onEdit={() => onEdit()}
                data={data as ComponentDataMap["featuredMedia"]}
            />
        );
    }

    // Media Showcase
    if (compId === "mediaShowcase") {
        return (
            <MediaShowcaseStat
                onEdit={onEdit}
                mediaConfig={mediaConfig}
                data={data as ComponentDataMap["mediaShowcase"]}
            />
        );
    }

    // Fallback
    return (
        <div className="flex h-full items-center justify-center p-4">
            <span className="text-gray-500">
                Unknown component: {compId}
            </span>
        </div>
    );
}
