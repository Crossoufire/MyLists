import {MediaType} from "@/lib/utils/enums";
import type {LucideIcon} from "lucide-react";


export interface MediaTerminology {
    plural: string;
    singular: string;
    verbPast: string;
    timeUnit: string;
    timeLabel: string;
    ratingLabel: string;
    verbPresent: string;
    timeUnitSingular: string;
}


export interface DefaultLayoutItem {
    compId: CompId;
    layout: LayoutSize;
}


export interface MediaTypeConfig {
    name: string;
    icon: LucideIcon;
    hasPages?: boolean;
    hasEpisodes?: boolean;
    hasChapters?: boolean;
    id: MediaType | "user";
    availableComps: CompId[];
    terminology: MediaTerminology;
    defaultLayout: DefaultLayoutItem[];
}


export interface LayoutConfig {
    cols: number;
    rows: number;
    units: number;
    label: string;
    size: LayoutSize;
}


export const LAYOUTS: Record<LayoutSize, LayoutConfig> = {
    "2x1": { size: "2x1", cols: 2, rows: 1, units: 2, label: "Wide" },
    "1x2": { size: "1x2", cols: 1, rows: 2, units: 2, label: "Tall" },
    "1x1": { size: "1x1", cols: 1, rows: 1, units: 1, label: "Small" },
    "2x2": { size: "2x2", cols: 2, rows: 2, units: 4, label: "Medium" },
    "3x1": { size: "3x1", cols: 3, rows: 1, units: 3, label: "Wide 3" },
    "4x1": { size: "4x1", cols: 4, rows: 1, units: 4, label: "Full Width" },
    "4x2": { size: "4x2", cols: 4, rows: 2, units: 8, label: "Full Large" },
};


export type Timeframe = "year" | "alltime";

export type LayoutSize = "1x1" | "2x1" | "1x2" | "2x2" | "3x1" | "4x1" | "4x2";

export type CompId =
    | "mediaCount"
    | "avgRating"
    | "timeSpent"
    | "favorites"
    | "activity"
    | "comments"
    | "topGenre"
    | "topActor"
    | "topDirector"
    | "topAuthor"
    | "topDeveloper"
    | "topPlatform"
    | "featuredMedia"
    | "mediaShowcase"
    | "yearInReview"
    | "episodesWatched"
    | "pagesRead"
    | "chaptersRead";


export type FeaturedMediaData = {
    name: string;
    mediaId: number;
    mediaCover: string;
} | null;

export type MediaShowcaseData = FeaturedMediaData[];


export interface ActiveComponent {
    compId: CompId;
    instanceId: number;
    layout: LayoutSize;
    manualData?: FeaturedMediaData | MediaShowcaseData;
}


export interface StatBlockProps {
    isLoading: boolean;
    timeframe: Timeframe;
    mediaConfig: MediaTypeConfig;
    onEdit?: (slotIndex?: number) => void;
}


export interface SingleValueData {
    value: number | string;
}


export interface TopItemData {
    name: string;
    count: number;
}


export interface YearInReviewData {
    favorites: number;
    mediaCount: number;
    timeSpent: number | string;
    avgRating: number | string;
}


export interface ComponentDataMap {
    topGenre: TopItemData;
    topActor: TopItemData;
    topAuthor: TopItemData;
    topPlatform: TopItemData;
    topDirector: TopItemData;
    topDeveloper: TopItemData;
    activity: SingleValueData;
    comments: SingleValueData;
    avgRating: SingleValueData;
    timeSpent: SingleValueData;
    favorites: SingleValueData;
    pagesRead: SingleValueData;
    mediaCount: SingleValueData;
    chaptersRead: SingleValueData;
    yearInReview: YearInReviewData;
    episodesWatched: SingleValueData;
    featuredMedia: FeaturedMediaData;
    mediaShowcase: MediaShowcaseData;
}


export interface ComponentDefinition<T extends CompId = CompId> {
    id: T;
    name: string;
    icon: LucideIcon;
    mode: "auto" | "manual";
    defaultLayout: LayoutSize;
    availableLayouts: LayoutSize[];
    supportedMedia: MediaType[] | "all";
    getDisplayName?: (config: MediaTypeConfig) => string;
}
